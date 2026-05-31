import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockInvalidateQueries = vi.fn();
const mockPush = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next-auth/react", () => ({
  signIn: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

import { GuestJoinModal } from "./GuestJoinModal";

const inviteProps = { mode: "invite" as const, roomId: "room-1", inviteToken: "valid-token", onClose: vi.fn() };

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", vi.fn());
  mockInvalidateQueries.mockResolvedValue(undefined);
});

describe("GuestJoinModal — mode=invite", () => {
  it("表示名入力フィールドとゲスト参加ボタンが表示される", () => {
    render(<GuestJoinModal {...inviteProps} />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ゲストとして参加" })).toBeInTheDocument();
  });

  it("OAuthログインボタンが表示される", () => {
    render(<GuestJoinModal {...inviteProps} />);
    expect(screen.getByText("Googleでログイン")).toBeInTheDocument();
    expect(screen.getByText("X（Twitter）でログイン")).toBeInTheDocument();
    expect(screen.getByText("Discordでログイン")).toBeInTheDocument();
  });

  it("51文字入力時は fetch を呼ばずバリデーションエラーを表示する", async () => {
    render(<GuestJoinModal {...inviteProps} />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "a".repeat(51) },
    });
    fireEvent.click(screen.getByRole("button", { name: "ゲストとして参加" }));

    await waitFor(() => {
      expect(screen.getByText("表示名は50文字以内で入力してください")).toBeInTheDocument();
    });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("成功時に invalidateQueries が room クエリで呼ばれる", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { roomId: "room-1", guestSessionId: "guest_abc" } }),
    } as Response);

    render(<GuestJoinModal {...inviteProps} />);

    fireEvent.change(screen.getByRole("textbox"), {
      target: { value: "テストユーザー" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ゲストとして参加" }));

    await waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["room", "room-1"] });
    });
  });

  it("ROOM_CLOSED エラーコードで正しいメッセージを表示する", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: { code: "ROOM_CLOSED" } }),
    } as Response);

    render(<GuestJoinModal {...inviteProps} />);
    fireEvent.click(screen.getByRole("button", { name: "ゲストとして参加" }));

    await waitFor(() => {
      expect(screen.getByText("この部屋はすでに終了しています")).toBeInTheDocument();
    });
  });

  it("ROOM_FULL エラーコードで正しいメッセージを表示する", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: { code: "ROOM_FULL" } }),
    } as Response);

    render(<GuestJoinModal {...inviteProps} />);
    fireEvent.click(screen.getByRole("button", { name: "ゲストとして参加" }));

    await waitFor(() => {
      expect(screen.getByText("この部屋は満員です")).toBeInTheDocument();
    });
  });

  it("INVITE_NOT_FOUND エラーコードで正しいメッセージを表示する", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: { code: "INVITE_NOT_FOUND" } }),
    } as Response);

    render(<GuestJoinModal {...inviteProps} />);
    fireEvent.click(screen.getByRole("button", { name: "ゲストとして参加" }));

    await waitFor(() => {
      expect(screen.getByText("招待リンクが無効です")).toBeInTheDocument();
    });
  });

  it("ALREADY_JOINED エラーコードで正しいメッセージを表示する", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: { code: "ALREADY_JOINED" } }),
    } as Response);

    render(<GuestJoinModal {...inviteProps} />);
    fireEvent.click(screen.getByRole("button", { name: "ゲストとして参加" }));

    await waitFor(() => {
      expect(screen.getByText("すでにこの部屋に参加しています")).toBeInTheDocument();
    });
  });

  it("fetch 中はゲスト参加ボタンが disabled になる", async () => {
    let resolveFetch!: () => void;
    vi.mocked(fetch).mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = () =>
          resolve({ ok: true, json: async () => ({ data: {} }) } as Response);
      })
    );

    render(<GuestJoinModal {...inviteProps} />);
    fireEvent.click(screen.getByRole("button", { name: "ゲストとして参加" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "参加中..." })).toBeDisabled();
    });

    resolveFetch();
  });

  it("正しい URL とボディで fetch が呼ばれる", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ data: { roomId: "room-1", guestSessionId: "guest_abc" } }),
    } as Response);

    render(<GuestJoinModal {...inviteProps} />);
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "Taro" } });
    fireEvent.click(screen.getByRole("button", { name: "ゲストとして参加" }));

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

describe("GuestJoinModal — mode=newUserError", () => {
  const newUserErrorProps = {
    mode: "newUserError" as const,
    roomId: "room-1",
    inviteToken: "valid-token",
  };

  it("新規登録不可のエラーメッセージが表示される", () => {
    render(<GuestJoinModal {...newUserErrorProps} />);
    expect(screen.getByText("招待リンクでの新規登録はできません")).toBeInTheDocument();
  });

  it("「プロフィールを設定して参加」リンクが /onboarding に向いている", () => {
    render(<GuestJoinModal {...newUserErrorProps} />);
    const link = screen.getByRole("link", { name: "プロフィールを設定して参加" });
    expect(link).toHaveAttribute("href", "/onboarding");
  });

  it("ゲスト参加フォームは表示されない", () => {
    render(<GuestJoinModal {...newUserErrorProps} />);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
});
