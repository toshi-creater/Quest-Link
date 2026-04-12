import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

const mockInvalidateQueries = vi.fn();
const mockPush = vi.fn();
const mockUpdate = vi.fn();

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ invalidateQueries: mockInvalidateQueries }),
  useQuery: () => ({
    data: {
      username: "テストユーザー",
      iconUrl: null,
      bio: "自己紹介",
      games: [],
    },
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: { user: { username: "テストユーザー", iconUrl: null } },
    update: mockUpdate,
    status: "authenticated",
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
    [key: string]: unknown;
  }) => <a href={href} {...rest}>{children}</a>,
}));

vi.mock("@phosphor-icons/react", () => ({
  ArrowLeft: () => <span />,
  FloppyDisk: () => <span />,
  Camera: () => <span />,
}));

vi.mock("@/components/ui/UserAvatar", () => ({
  UserAvatar: () => <div data-testid="user-avatar" />,
}));

vi.mock("@/components/ui/GamePicker", () => ({
  MultiGamePicker: () => <div data-testid="game-picker" />,
}));

import EditProfilePage from "./page";

beforeEach(() => {
  vi.clearAllMocks();
  mockInvalidateQueries.mockResolvedValue(undefined);
  mockUpdate.mockResolvedValue(undefined);
  vi.stubGlobal("fetch", vi.fn());
});

describe("EditProfilePage", () => {
  it("ユーザー名フィールド・自己紹介フィールド・保存ボタンが表示される", () => {
    render(<EditProfilePage />);
    expect(screen.getAllByRole("textbox")).toHaveLength(2);
    expect(screen.getByRole("button", { name: "保存する" })).toBeInTheDocument();
  });

  it("保存成功後に ['users', 'me'] クエリのキャッシュが invalidate される", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    render(<EditProfilePage />);
    fireEvent.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalledWith({ queryKey: ["users", "me"] });
    });
  });

  it("invalidateQueries が完了してから /users/me に遷移する", async () => {
    let resolveInvalidate!: () => void;
    mockInvalidateQueries.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveInvalidate = resolve;
      })
    );

    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as Response);

    render(<EditProfilePage />);
    fireEvent.click(screen.getByRole("button", { name: "保存する" }));

    // invalidateQueries 完了前は router.push が呼ばれない
    await waitFor(() => {
      expect(mockInvalidateQueries).toHaveBeenCalled();
    });
    expect(mockPush).not.toHaveBeenCalled();

    resolveInvalidate();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/users/me");
    });
  });

  it("PATCH API 失敗時は invalidateQueries と router.push が呼ばれない", async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: async () => ({ error: "ユーザー名が重複しています" }),
    } as Response);

    render(<EditProfilePage />);
    fireEvent.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => {
      expect(screen.getByText("ユーザー名が重複しています")).toBeInTheDocument();
    });

    expect(mockInvalidateQueries).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("保存中はボタンが disabled になる", async () => {
    let resolveFetch!: () => void;
    vi.mocked(fetch).mockReturnValue(
      new Promise<Response>((resolve) => {
        resolveFetch = () =>
          resolve({ ok: true, json: async () => ({}) } as Response);
      })
    );

    render(<EditProfilePage />);
    fireEvent.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "保存中..." })).toBeDisabled();
    });

    resolveFetch();

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "保存する" })).not.toBeDisabled();
    });
  });
});
