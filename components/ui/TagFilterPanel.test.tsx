import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TagFilterPanel } from "./TagFilterPanel";

const tags = [
  { id: "1", name: "ガチ勢", slug: "hardcore", displayOrder: 1, category: { id: "c1", name: "プレイスタイル", slug: "play_style" } },
  { id: "2", name: "エンジョイ勢", slug: "casual", displayOrder: 2, category: { id: "c1", name: "プレイスタイル", slug: "play_style" } },
  { id: "3", name: "深夜勢", slug: "late_night", displayOrder: 5, category: { id: "c2", name: "時間帯", slug: "schedule" } },
  { id: "4", name: "PC", slug: "platform_pc", displayOrder: 15, category: null },
];

describe("TagFilterPanel", () => {
  it("renders nothing when closed", () => {
    const { container } = render(
      <TagFilterPanel tags={tags} selectedTags={[]} onToggle={vi.fn()} open={false} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders tags grouped by category when open", () => {
    render(
      <TagFilterPanel tags={tags} selectedTags={[]} onToggle={vi.fn()} open={true} />
    );
    expect(screen.getByText("プレイスタイル")).toBeTruthy();
    expect(screen.getByText("時間帯")).toBeTruthy();
    expect(screen.getByText("ガチ勢")).toBeTruthy();
    expect(screen.getByText("エンジョイ勢")).toBeTruthy();
    expect(screen.getByText("深夜勢")).toBeTruthy();
  });

  it("calls onToggle when a tag is clicked", () => {
    const onToggle = vi.fn();
    render(
      <TagFilterPanel tags={tags} selectedTags={[]} onToggle={onToggle} open={true} />
    );
    fireEvent.click(screen.getByText("ガチ勢"));
    expect(onToggle).toHaveBeenCalledWith("hardcore");
  });

  it("does not render apply button when onApply is not provided", () => {
    render(
      <TagFilterPanel tags={tags} selectedTags={[]} onToggle={vi.fn()} open={true} />
    );
    expect(screen.queryByText("絞り込む")).toBeNull();
  });

  it("renders apply button with default label when onApply is provided", () => {
    render(
      <TagFilterPanel tags={tags} selectedTags={[]} onToggle={vi.fn()} open={true} onApply={vi.fn()} />
    );
    expect(screen.getByText("絞り込む")).toBeTruthy();
  });

  it("renders apply button with custom label when applyLabel is provided", () => {
    render(
      <TagFilterPanel tags={tags} selectedTags={[]} onToggle={vi.fn()} open={true} onApply={vi.fn()} applyLabel="決定" />
    );
    expect(screen.getByText("決定")).toBeTruthy();
  });

  it("calls onApply when apply button is clicked", () => {
    const onApply = vi.fn();
    render(
      <TagFilterPanel tags={tags} selectedTags={[]} onToggle={vi.fn()} open={true} onApply={onApply} />
    );
    fireEvent.click(screen.getByText("絞り込む"));
    expect(onApply).toHaveBeenCalledOnce();
  });

  it("全ボタンが type='button' を持つ（フォーム内でのsubmit防止）", () => {
    render(
      <TagFilterPanel tags={tags} selectedTags={[]} onToggle={vi.fn()} open={true} onApply={vi.fn()} />
    );
    const buttons = screen.getAllByRole("button");
    buttons.forEach((btn) => {
      expect(btn).toHaveAttribute("type", "button");
    });
  });

  it("パネル外をクリックすると onClickOutside が呼ばれる", () => {
    const onClickOutside = vi.fn();
    render(
      <TagFilterPanel tags={tags} selectedTags={[]} onToggle={vi.fn()} open={true} onClickOutside={onClickOutside} />
    );
    fireEvent.mouseDown(document.body);
    expect(onClickOutside).toHaveBeenCalledOnce();
  });

  it("パネル内をクリックしても onClickOutside は呼ばれない", () => {
    const onClickOutside = vi.fn();
    render(
      <TagFilterPanel tags={tags} selectedTags={[]} onToggle={vi.fn()} open={true} onClickOutside={onClickOutside} />
    );
    fireEvent.mouseDown(screen.getByText("ガチ勢"));
    expect(onClickOutside).not.toHaveBeenCalled();
  });

  it("パネルが閉じているときは onClickOutside が登録されない", () => {
    const onClickOutside = vi.fn();
    render(
      <TagFilterPanel tags={tags} selectedTags={[]} onToggle={vi.fn()} open={false} onClickOutside={onClickOutside} />
    );
    fireEvent.mouseDown(document.body);
    expect(onClickOutside).not.toHaveBeenCalled();
  });

  it("ignoreRef 要素の mousedown では onClickOutside が呼ばれない", () => {
    const onClickOutside = vi.fn();
    const toggleBtn = document.createElement("button");
    document.body.appendChild(toggleBtn);
    const ignoreRef = { current: toggleBtn };
    render(
      <TagFilterPanel tags={tags} selectedTags={[]} onToggle={vi.fn()} open={true} onClickOutside={onClickOutside} ignoreRef={ignoreRef} />
    );
    fireEvent.mouseDown(toggleBtn);
    expect(onClickOutside).not.toHaveBeenCalled();
    toggleBtn.remove();
  });

  it("ignoreRef 以外の外部要素の mousedown では onClickOutside が呼ばれる", () => {
    const onClickOutside = vi.fn();
    const toggleBtn = document.createElement("button");
    const ignoreRef = { current: toggleBtn };
    render(
      <TagFilterPanel tags={tags} selectedTags={[]} onToggle={vi.fn()} open={true} onClickOutside={onClickOutside} ignoreRef={ignoreRef} />
    );
    fireEvent.mouseDown(document.body);
    expect(onClickOutside).toHaveBeenCalledOnce();
  });
});
