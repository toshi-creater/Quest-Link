import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

const mockUseSession = vi.fn();

vi.mock("next-auth/react", () => ({
  useSession: () => mockUseSession(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    style,
    "aria-label": ariaLabel,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
    "aria-label"?: string;
  }) => (
    <a href={href} className={className} style={style} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

vi.mock("@phosphor-icons/react", () => ({
  Chat: () => <span />,
  Users: () => <span />,
  PlusCircle: () => <span />,
  MagnifyingGlass: () => <span />,
  House: () => <span />,
  User: () => <span />,
  SignOut: () => <span />,
}));

vi.mock("@/components/ui/Logo", () => ({
  Logo: () => <div data-testid="logo" />,
}));

vi.mock("@/components/ui/UserAvatarMenu", () => ({
  UserAvatarMenu: () => <button aria-label="ユーザーメニューを開く" />,
}));

import { Header } from "./Header";

afterEach(() => {
  cleanup();
});

function getNavLink(label: string) {
  return screen.getByRole("link", { name: new RegExp(label) });
}

describe("Header - 認証済みナビアクティブ状態", () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({
      status: "authenticated",
      data: { user: { username: "testuser", iconUrl: null } },
    });
  });

  it("/games では部屋を探すがアクティブ", () => {
    mockUsePathname.mockReturnValue("/games");
    render(<Header />);
    expect(getNavLink("部屋を探す")).toHaveClass("text-white");
  });

  it("/games/[gameId]/rooms では部屋を探すがアクティブ", () => {
    mockUsePathname.mockReturnValue("/games/123/rooms");
    render(<Header />);
    expect(getNavLink("部屋を探す")).toHaveClass("text-white");
  });

  it("/rooms/new では部屋作成がアクティブ", () => {
    mockUsePathname.mockReturnValue("/rooms/new");
    render(<Header />);
    expect(getNavLink("部屋作成")).toHaveClass("text-white");
  });

  it("/rooms/[roomId] ではチャットリンクがアクティブ", () => {
    mockUsePathname.mockReturnValue("/rooms/abc123");
    render(<Header />);
    const chatLink = screen.getByRole("link", { name: "参加中の部屋" });
    expect(chatLink).toHaveClass("text-white");
  });

  it("/ ではチャットリンクが非アクティブ", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Header />);
    const chatLink = screen.getByRole("link", { name: "参加中の部屋" });
    expect(chatLink).not.toHaveClass("text-white");
  });

  it("認証済みのとき UserAvatarMenu が表示される", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Header />);
    expect(screen.getByRole("button", { name: "ユーザーメニューを開く" })).toBeInTheDocument();
  });

  it("検索バーのプレースホルダーが表示される", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Header />);
    expect(screen.getByPlaceholderText("ゲームを検索...")).toBeInTheDocument();
  });
});

describe("Header - 未認証状態", () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({ status: "unauthenticated", data: null });
  });

  it("未認証のときログインリンクが表示される", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Header />);
    expect(screen.getByRole("link", { name: "ログイン" })).toBeInTheDocument();
  });

  it("未認証のときチャットリンクが表示されない", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Header />);
    expect(screen.queryByRole("link", { name: "参加中の部屋" })).toBeNull();
  });
});

describe("Header - 非表示", () => {
  beforeEach(() => {
    mockUseSession.mockReturnValue({ status: "unauthenticated", data: null });
  });

  it("/login では Header が非表示", () => {
    mockUsePathname.mockReturnValue("/login");
    const { container } = render(<Header />);
    expect(container.firstChild).toBeNull();
  });
});
