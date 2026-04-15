import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TagFilterToggle } from "./TagFilterToggle";

describe("TagFilterToggle", () => {
  it("「タグで絞り込み」ボタンが表示される", () => {
    render(<TagFilterToggle selectedCount={0} panelOpen={false} onPanelToggle={() => {}} />);
    expect(screen.getByText("タグで絞り込み")).toBeInTheDocument();
  });

  it("selectedCount が 0 のときバッジが表示されない", () => {
    render(<TagFilterToggle selectedCount={0} panelOpen={false} onPanelToggle={() => {}} />);
    expect(screen.queryByText("0")).not.toBeInTheDocument();
  });

  it("selectedCount が 1 以上のときバッジに件数が表示される", () => {
    render(<TagFilterToggle selectedCount={3} panelOpen={false} onPanelToggle={() => {}} />);
    expect(screen.getByText("3")).toBeInTheDocument();
  });

  it("クリックで onPanelToggle が呼ばれる", () => {
    const handleToggle = vi.fn();
    render(<TagFilterToggle selectedCount={0} panelOpen={false} onPanelToggle={handleToggle} />);
    fireEvent.click(screen.getByRole("button"));
    expect(handleToggle).toHaveBeenCalledTimes(1);
  });

  it("label prop を渡すとそのラベルが表示される", () => {
    render(<TagFilterToggle selectedCount={0} panelOpen={false} onPanelToggle={() => {}} label="タグを選択" />);
    expect(screen.getByText("タグを選択")).toBeInTheDocument();
  });

  it("panelOpen が true のとき ChevronDown が回転スタイルを持つ", () => {
    const { container } = render(
      <TagFilterToggle selectedCount={0} panelOpen={true} onPanelToggle={() => {}} />
    );
    const chevron = container.querySelector("svg:last-child");
    expect(chevron).toHaveStyle({ transform: "rotate(180deg)" });
  });

  it("ボタンが type='button' を持つ（フォーム内でのsubmit防止）", () => {
    render(<TagFilterToggle selectedCount={0} panelOpen={false} onPanelToggle={() => {}} />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });
});
