import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@phosphor-icons/react", () => ({
  ArrowLeft: () => <span data-testid="icon-arrow-left" />,
  CaretRight: () => <span data-testid="icon-caret-right" />,
}));

import { OnboardingNavButtons } from "./OnboardingNavButtons";

describe("OnboardingNavButtons", () => {
  it("onBack が未指定の場合 Back ボタンを表示しない", () => {
    render(<OnboardingNavButtons primaryLabel="次へ" onPrimary={vi.fn()} />);
    expect(screen.queryByText("戻る")).not.toBeInTheDocument();
  });

  it("onBack が指定された場合 Back ボタンを表示する", () => {
    render(
      <OnboardingNavButtons primaryLabel="次へ" onPrimary={vi.fn()} onBack={vi.fn()} />
    );
    expect(screen.getByText("戻る")).toBeInTheDocument();
  });

  it("primaryWidth='full' のとき Primary ボタンに w-full クラスが付く", () => {
    render(
      <OnboardingNavButtons primaryLabel="次へ" onPrimary={vi.fn()} primaryWidth="full" />
    );
    const btn = screen.getByRole("button", { name: /次へ/ });
    expect(btn.className).toContain("w-full");
  });

  it("primaryDisabled={true} のとき Primary ボタンが disabled になる", () => {
    render(
      <OnboardingNavButtons primaryLabel="次へ" onPrimary={vi.fn()} primaryDisabled />
    );
    expect(screen.getByRole("button", { name: /次へ/ })).toBeDisabled();
  });

  it("showPrimaryIcon={false} のとき CaretRight アイコンを表示しない", () => {
    render(
      <OnboardingNavButtons primaryLabel="はじめる" onPrimary={vi.fn()} showPrimaryIcon={false} />
    );
    expect(screen.queryByTestId("icon-caret-right")).not.toBeInTheDocument();
  });

  it("デフォルトで CaretRight アイコンを表示する", () => {
    render(<OnboardingNavButtons primaryLabel="次へ" onPrimary={vi.fn()} />);
    expect(screen.getByTestId("icon-caret-right")).toBeInTheDocument();
  });
});
