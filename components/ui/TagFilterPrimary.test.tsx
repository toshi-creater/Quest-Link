import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { TagFilterPrimary, PRIMARY_TAG_COUNT } from "./TagFilterPrimary";

const makeTags = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: String(i),
    name: `タグ${i + 1}`,
    slug: `tag_${i + 1}`,
    displayOrder: i + 1,
    category: null,
  }));

describe("TagFilterPrimary", () => {
  it("renders only PRIMARY_TAG_COUNT tags", () => {
    const tags = makeTags(10);
    render(
      <TagFilterPrimary
        tags={tags}
        selectedTags={[]}
        onToggle={vi.fn()}
        panelOpen={false}
        onPanelToggle={vi.fn()}
        extraSelectedCount={0}
      />
    );
    for (let i = 0; i < PRIMARY_TAG_COUNT; i++) {
      expect(screen.getByText(`タグ${i + 1}`)).toBeTruthy();
    }
    expect(screen.queryByText(`タグ${PRIMARY_TAG_COUNT + 1}`)).toBeNull();
  });

  it("calls onToggle when a tag button is clicked", () => {
    const tags = makeTags(6);
    const onToggle = vi.fn();
    render(
      <TagFilterPrimary
        tags={tags}
        selectedTags={[]}
        onToggle={onToggle}
        panelOpen={false}
        onPanelToggle={vi.fn()}
        extraSelectedCount={0}
      />
    );
    fireEvent.click(screen.getByText("タグ1"));
    expect(onToggle).toHaveBeenCalledWith("tag_1");
  });

  it("calls onPanelToggle when すべて表示 is clicked", () => {
    const tags = makeTags(6);
    const onPanelToggle = vi.fn();
    render(
      <TagFilterPrimary
        tags={tags}
        selectedTags={[]}
        onToggle={vi.fn()}
        panelOpen={false}
        onPanelToggle={onPanelToggle}
        extraSelectedCount={0}
      />
    );
    fireEvent.click(screen.getByText("すべて表示"));
    expect(onPanelToggle).toHaveBeenCalledOnce();
  });

  it("shows badge when extraSelectedCount > 0 and panel is closed", () => {
    const tags = makeTags(6);
    render(
      <TagFilterPrimary
        tags={tags}
        selectedTags={[]}
        onToggle={vi.fn()}
        panelOpen={false}
        onPanelToggle={vi.fn()}
        extraSelectedCount={3}
      />
    );
    expect(screen.getByText("3")).toBeTruthy();
  });

  it("hides badge when panel is open", () => {
    const tags = makeTags(6);
    render(
      <TagFilterPrimary
        tags={tags}
        selectedTags={[]}
        onToggle={vi.fn()}
        panelOpen={true}
        onPanelToggle={vi.fn()}
        extraSelectedCount={3}
      />
    );
    expect(screen.queryByText("3")).toBeNull();
  });
});
