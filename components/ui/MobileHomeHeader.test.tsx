import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  usePathname: () => "/",
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@phosphor-icons/react", () => ({
  MagnifyingGlass: () => <span />,
  X: () => <span />,
}));

vi.mock("@/components/ui/Logo", () => ({
  Logo: () => <div data-testid="logo" />,
}));

vi.mock("@/components/ui/HeaderSearchBar", () => ({
  HeaderSearchBar: () => <input placeholder="検索" aria-label="検索" />,
}));

import { MobileHomeHeader } from "./MobileHomeHeader";

afterEach(() => {
  cleanup();
});

describe("MobileHomeHeader", () => {
  it("ロゴが表示される", () => {
    render(<MobileHomeHeader />);
    expect(screen.getByTestId("logo")).toBeInTheDocument();
  });

  it("初期状態では検索を開くボタンのみがアクセシブル", () => {
    render(<MobileHomeHeader />);
    expect(screen.getByRole("button", { name: "検索を開く" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "検索を閉じる" })).toBeNull();
  });

  it("ボタンをタップすると検索を閉じるボタンがアクセシブルになり開くボタンは隠れる", () => {
    render(<MobileHomeHeader />);
    fireEvent.click(screen.getByRole("button", { name: "検索を開く" }));
    expect(screen.getByRole("button", { name: "検索を閉じる" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "検索を開く" })).toBeNull();
  });

  it("再度タップすると元に戻る", () => {
    render(<MobileHomeHeader />);
    fireEvent.click(screen.getByRole("button", { name: "検索を開く" }));
    fireEvent.click(screen.getByRole("button", { name: "検索を閉じる" }));
    expect(screen.getByRole("button", { name: "検索を開く" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "検索を閉じる" })).toBeNull();
  });

  it("検索バーは DOM に存在する", () => {
    render(<MobileHomeHeader />);
    expect(screen.getByPlaceholderText("検索")).toBeInTheDocument();
  });
});
