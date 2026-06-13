import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
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

vi.mock("@phosphor-icons/react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@phosphor-icons/react")>();
  return { ...actual };
});

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

  it("/login では BottomNav が非表示", () => {
    mockUsePathname.mockReturnValue("/login");
    const { container } = render(<BottomNav />);
    expect(container.firstChild).toBeNull();
  });
});
