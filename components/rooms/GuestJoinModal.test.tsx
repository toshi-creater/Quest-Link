import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockInvalidateQueries = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

import { GuestJoinModal } from "./GuestJoinModal";

const defaultProps = { roomId: "room-1", inviteToken: "valid-token" };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn());
  mockInvalidateQueries.mockResolvedValue(undefined);
});

describe("GuestJoinModal", () => {
  it("入力フィールドと参加ボタンが表示される", () => {
    render(<GuestJoinModal {...defaultProps} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "参加する" })).toBeInTheDocument();
  });

  it("51文字入力時は fetch を呼ばずバリデーションエラーを表示する", async () => {
    render(<GuestJoinModal {...defaultProps} />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "a".repeat(51) },
    });
    fireEvent.click(screen.getByRole("button", { name: "参加する" }));

    await waitFor(() => {
      expect(screen.getByText("表示名は50文字以内で入力してください")).toBeInTheDocument();
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("成功時に invalidateQueries が room クエリで呼ばれる", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { roomId: "room-1", guestSessionId: "guest_abc", isGuest: true } }),
    } as Response);

    render(<GuestJoinModal {...defaultProps} />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "テストユーザー" },
    });
    fireEvent.click(screen.getByRole("button", { name: "参加する" }));

    await waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["room", "room-1"] });
    });
  });

  it("ROOM_CLOSED エラーコードで正しいメッセージを表示する", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: { code: "ROOM_CLOSED" } }),
    } as Response);

    render(<GuestJoinModal {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "参加する" }));

    await waitFor(() => {
      expect(screen.getByText("この部屋はすでに終了しています")).toBeInTheDocument();
    });
  });

  it("ROOM_FULL エラーコードで正しいメッセージを表示する", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: { code: "ROOM_FULL" } }),
    } as Response);

    render(<GuestJoinModal {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "参加する" }));

    await waitFor(() => {
      expect(screen.getByText("この部屋は満員です")).toBeInTheDocument();
    });
  });

  it("INVITE_NOT_FOUND エラーコードで正しいメッセージを表示する", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: { code: "INVITE_NOT_FOUND" } }),
    } as Response);

    render(<GuestJoinModal {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "参加する" }));

    await waitFor(() => {
      expect(screen.getByText("招待リンクが無効です")).toBeInTheDocument();
    });
  });

  it("ALREADY_JOINED エラーコードで正しいメッセージを表示する", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: { code: "ALREADY_JOINED" } }),
    } as Response);

    render(<GuestJoinModal {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "参加する" }));

    await waitFor(() => {
      expect(screen.getByText("すでにこの部屋に参加しています")).toBeInTheDocument();
    });
  });

  it("fetch 中はボタンが disabled になる", async () => {
    let resolveFetch!: () => void;
    vi.mocked(fetch).mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = () =>
          resolve({
            ok: true,
            json: async () => ({ data: {} }),
          } as Response);
      })
    );

    render(<GuestJoinModal {...defaultProps} />);
    fireEvent.click(screen.getByRole("button", { name: "参加する" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "参加中..." })).toBeDisabled();
    });

    resolveFetch();
  });

  it("正しい URL とボディで fetch が呼ばれる", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { roomId: "room-1", guestSessionId: "guest_abc", isGuest: true } }),
    } as Response);

    render(<GuestJoinModal {...defaultProps} />);
    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "Taro" },
    });
    fireEvent.click(screen.getByRole("button", { name: "参加する" }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        "/api/v1/invite/valid-token/join",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ displayName: "Taro" }),
        })
      );
    });
  });
});
