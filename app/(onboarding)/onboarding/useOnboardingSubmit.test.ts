import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockUpdate = vi.fn();
vi.mock("next-auth/react", () => ({
  useSession: () => ({ update: mockUpdate }),
}));

import { useOnboardingSubmit } from "./useOnboardingSubmit";
import { type Game } from "@/lib/mock-data";

const mockGame: Game = { id: "game-1", name: "Valorant", coverImageUrl: null };

const defaultParams = {
  avatarFile: null,
  username: "testuser",
  bio: "Hello",
  selectedGames: [mockGame],
  callbackUrl: null,
};

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
  mockUpdate.mockResolvedValue(undefined);
});

describe("useOnboardingSubmit", () => {
  describe("正常系", () => {
    it("アバターなしで送信すると PATCH /api/v1/users/me を呼び /rooms にリダイレクトする", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      const { result } = renderHook(() => useOnboardingSubmit(defaultParams));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(fetch).toHaveBeenCalledTimes(1);
      expect(fetch).toHaveBeenCalledWith(
        "/api/v1/users/me",
        expect.objectContaining({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "testuser",
            bio: "Hello",
            gameIds: ["game-1"],
          }),
        })
      );
      expect(mockUpdate).toHaveBeenCalledWith({ username: "testuser" });
      expect(mockPush).toHaveBeenCalledWith("/rooms");
      expect(result.current.error).toBeNull();
      expect(result.current.saving).toBe(false);
    });

    it("アバターありで送信すると POST /api/v1/users/me/avatar → PATCH の順に呼ばれる", async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce({ ok: true } as Response)
        .mockResolvedValueOnce({ ok: true, json: async () => ({}) } as Response);

      const file = new File(["img"], "avatar.png", { type: "image/png" });
      const { result } = renderHook(() =>
        useOnboardingSubmit({ ...defaultParams, avatarFile: file })
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(fetch).toHaveBeenCalledTimes(2);
      expect(fetch).toHaveBeenNthCalledWith(
        1,
        "/api/v1/users/me/avatar",
        expect.objectContaining({ method: "POST" })
      );
      expect(fetch).toHaveBeenNthCalledWith(
        2,
        "/api/v1/users/me",
        expect.objectContaining({ method: "PATCH" })
      );
      expect(mockPush).toHaveBeenCalledWith("/rooms");
    });

    it("callbackUrl が / で始まる場合はそちらにリダイレクトする", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      const { result } = renderHook(() =>
        useOnboardingSubmit({ ...defaultParams, callbackUrl: "/rooms/abc" })
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockPush).toHaveBeenCalledWith("/rooms/abc");
    });

    it("callbackUrl が外部 URL の場合は /rooms にリダイレクトする", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      const { result } = renderHook(() =>
        useOnboardingSubmit({ ...defaultParams, callbackUrl: "https://evil.com" })
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(mockPush).toHaveBeenCalledWith("/rooms");
    });
  });

  describe("エラー系", () => {
    it("アバターアップロード失敗時にエラーをセットして PATCH を呼ばない", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({ ok: false } as Response);

      const file = new File(["img"], "avatar.png", { type: "image/png" });
      const { result } = renderHook(() =>
        useOnboardingSubmit({ ...defaultParams, avatarFile: file })
      );

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.error).toBe("画像のアップロードに失敗しました");
      expect(fetch).toHaveBeenCalledTimes(1);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("PATCH 失敗時に API のエラーメッセージをセットする", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "ユーザー名が重複しています" }),
      } as Response);

      const { result } = renderHook(() => useOnboardingSubmit(defaultParams));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.error).toBe("ユーザー名が重複しています");
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("PATCH 失敗で error フィールドがない場合はデフォルトメッセージを使う", async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        json: async () => ({}),
      } as Response);

      const { result } = renderHook(() => useOnboardingSubmit(defaultParams));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.error).toBe("エラーが発生しました");
    });

    it("通信エラー時にデフォルトエラーメッセージをセットする", async () => {
      vi.mocked(fetch).mockRejectedValueOnce(new Error("Network error"));

      const { result } = renderHook(() => useOnboardingSubmit(defaultParams));

      await act(async () => {
        await result.current.handleSubmit();
      });

      expect(result.current.error).toBe("通信エラーが発生しました。再度お試しください");
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("saving フラグ", () => {
    it("送信中は saving が true になり、完了後に false に戻る", async () => {
      let resolveFetch!: (value: Response | PromiseLike<Response>) => void;
      vi.mocked(fetch).mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFetch = resolve;
        }) as Promise<Response>
      );

      const { result } = renderHook(() => useOnboardingSubmit(defaultParams));

      act(() => {
        void result.current.handleSubmit();
      });
      expect(result.current.saving).toBe(true);

      await act(async () => {
        resolveFetch({ ok: true, json: async () => ({}) } as Response);
      });
      expect(result.current.saving).toBe(false);
    });
  });
});
