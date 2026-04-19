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

vi.mock("@/components/ui/UserAvatar", () => ({
  UserAvatar: ({ username }: { username: string }) => (
    <span data-testid="user-avatar">{username}</span>
  ),
}));

import { BottomNav } from "./BottomNav";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  mockUseSession.mockReturnValue({
    status: "authenticated",
    data: { user: { username: "testuser", iconUrl: null } },
  });
});

function getNavLink(label: string) {
  return screen.getByRole("link", { name: new RegExp(label) });
}

function isActiveLink(label: string) {
  const link = getNavLink(label);
  return (link as HTMLElement).style.fontWeight === "500";
}

describe("BottomNav - ナビアクティブ状態", () => {
  it("/ ではトップがアクティブ", () => {
    mockUsePathname.mockReturnValue("/");
    render(<BottomNav />);
    expect(isActiveLink("トップ")).toBe(true);
    expect(isActiveLink("探す")).toBe(false);
  });

  it("/games では探すがアクティブ", () => {
    mockUsePathname.mockReturnValue("/games");
    render(<BottomNav />);
    expect(isActiveLink("探す")).toBe(true);
    expect(isActiveLink("トップ")).toBe(false);
  });

  it("/games/[gameId]/rooms では探すがアクティブ (AC3)", () => {
    mockUsePathname.mockReturnValue("/games/123/rooms");
    render(<BottomNav />);
    expect(isActiveLink("探す")).toBe(true);
  });

  it("/rooms/new では部屋作成がアクティブ", () => {
    mockUsePathname.mockReturnValue("/rooms/new");
    render(<BottomNav />);
    expect(isActiveLink("部屋作成")).toBe(true);
    expect(isActiveLink("参加中")).toBe(false);
  });

  it("/rooms/[roomId] では参加中がアクティブ (AC1)", () => {
    mockUsePathname.mockReturnValue("/rooms/abc123");
    render(<BottomNav />);
    expect(isActiveLink("参加中")).toBe(true);
    expect(isActiveLink("部屋作成")).toBe(false);
  });

  it("/rooms/[roomId]/chat では参加中がアクティブ", () => {
    mockUsePathname.mockReturnValue("/rooms/abc123/chat");
    render(<BottomNav />);
    expect(isActiveLink("参加中")).toBe(true);
  });

  it("/rooms/[roomId]/ratings では参加中がアクティブ", () => {
    mockUsePathname.mockReturnValue("/rooms/abc123/ratings");
    render(<BottomNav />);
    expect(isActiveLink("参加中")).toBe(true);
  });

  it("/rooms/current では参加中がアクティブ", () => {
    mockUsePathname.mockReturnValue("/rooms/current");
    render(<BottomNav />);
    expect(isActiveLink("参加中")).toBe(true);
  });

  it("/users/me ではプロフィールがアクティブ", () => {
    mockUsePathname.mockReturnValue("/users/me");
    render(<BottomNav />);
    expect(isActiveLink("プロフィール")).toBe(true);
  });

  it("/users/me/edit ではプロフィールがアクティブ (AC2)", () => {
    mockUsePathname.mockReturnValue("/users/me/edit");
    render(<BottomNav />);
    expect(isActiveLink("プロフィール")).toBe(true);
  });

  it("/users/me/history ではプロフィールがアクティブ (AC2)", () => {
    mockUsePathname.mockReturnValue("/users/me/history");
    render(<BottomNav />);
    expect(isActiveLink("プロフィール")).toBe(true);
  });

  it("/login では BottomNav が非表示", () => {
    mockUsePathname.mockReturnValue("/login");
    const { container } = render(<BottomNav />);
    expect(container.firstChild).toBeNull();
  });
});

describe("BottomNav - プロフィール項目のアバター", () => {
  it("認証済みのときプロフィール項目にアバターが表示される", () => {
    mockUseSession.mockReturnValue({
      status: "authenticated",
      data: { user: { username: "testuser", iconUrl: null } },
    });
    mockUsePathname.mockReturnValue("/");
    render(<BottomNav />);
    expect(screen.getByTestId("user-avatar")).toBeInTheDocument();
  });

  it("未認証のときプロフィール項目にアバターが表示されない", () => {
    mockUseSession.mockReturnValue({ status: "unauthenticated", data: null });
    mockUsePathname.mockReturnValue("/");
    render(<BottomNav />);
    expect(screen.queryByTestId("user-avatar")).toBeNull();
  });
});
