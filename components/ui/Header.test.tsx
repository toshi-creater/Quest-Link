import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";

const mockUsePathname = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({ status: "authenticated" }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
    style,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
  }) => (
    <a href={href} className={className} style={style}>
      {children}
    </a>
  ),
}));

vi.mock("@phosphor-icons/react", () => ({
  House: () => <span />,
  PlusCircle: () => <span />,
  Chat: () => <span />,
  User: () => <span />,
  Users: () => <span />,
}));

vi.mock("@/components/ui/SignOutButton", () => ({
  SignOutButton: () => <button>サインアウト</button>,
}));

vi.mock("@/components/ui/Logo", () => ({
  Logo: () => <div data-testid="logo" />,
}));

import { Header } from "./Header";

afterEach(() => {
  cleanup();
});

function getNavLink(label: string) {
  return screen.getByRole("link", { name: new RegExp(label) });
}

describe("Header - ナビアクティブ状態", () => {
  it("/ ではトップがアクティブ", () => {
    mockUsePathname.mockReturnValue("/");
    render(<Header />);
    expect(getNavLink("トップ")).toHaveClass("text-white");
    expect(getNavLink("部屋を探す")).not.toHaveClass("text-white");
  });

  it("/games では部屋を探すがアクティブ", () => {
    mockUsePathname.mockReturnValue("/games");
    render(<Header />);
    expect(getNavLink("部屋を探す")).toHaveClass("text-white");
    expect(getNavLink("トップ")).not.toHaveClass("text-white");
  });

  it("/games/[gameId]/rooms では部屋を探すがアクティブ (AC3)", () => {
    mockUsePathname.mockReturnValue("/games/123/rooms");
    render(<Header />);
    expect(getNavLink("部屋を探す")).toHaveClass("text-white");
  });

  it("/rooms/new では部屋作成がアクティブ", () => {
    mockUsePathname.mockReturnValue("/rooms/new");
    render(<Header />);
    expect(getNavLink("部屋作成")).toHaveClass("text-white");
    expect(getNavLink("参加中の部屋")).not.toHaveClass("text-white");
  });

  it("/rooms/[roomId] では参加中の部屋がアクティブ (AC1)", () => {
    mockUsePathname.mockReturnValue("/rooms/abc123");
    render(<Header />);
    expect(getNavLink("参加中の部屋")).toHaveClass("text-white");
    expect(getNavLink("部屋作成")).not.toHaveClass("text-white");
  });

  it("/rooms/[roomId]/chat では参加中の部屋がアクティブ", () => {
    mockUsePathname.mockReturnValue("/rooms/abc123/chat");
    render(<Header />);
    expect(getNavLink("参加中の部屋")).toHaveClass("text-white");
  });

  it("/rooms/[roomId]/ratings では参加中の部屋がアクティブ", () => {
    mockUsePathname.mockReturnValue("/rooms/abc123/ratings");
    render(<Header />);
    expect(getNavLink("参加中の部屋")).toHaveClass("text-white");
  });

  it("/rooms/current では参加中の部屋がアクティブ", () => {
    mockUsePathname.mockReturnValue("/rooms/current");
    render(<Header />);
    expect(getNavLink("参加中の部屋")).toHaveClass("text-white");
  });

  it("/users/me ではプロフィールがアクティブ", () => {
    mockUsePathname.mockReturnValue("/users/me");
    render(<Header />);
    expect(getNavLink("プロフィール")).toHaveClass("text-white");
  });

  it("/users/me/edit ではプロフィールがアクティブ (AC2)", () => {
    mockUsePathname.mockReturnValue("/users/me/edit");
    render(<Header />);
    expect(getNavLink("プロフィール")).toHaveClass("text-white");
  });

  it("/users/me/history ではプロフィールがアクティブ (AC2)", () => {
    mockUsePathname.mockReturnValue("/users/me/history");
    render(<Header />);
    expect(getNavLink("プロフィール")).toHaveClass("text-white");
  });

  it("/login では Header が非表示", () => {
    mockUsePathname.mockReturnValue("/login");
    const { container } = render(<Header />);
    expect(container.firstChild).toBeNull();
  });
});
