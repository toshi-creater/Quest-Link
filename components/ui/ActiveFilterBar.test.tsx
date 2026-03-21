import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ActiveFilterBar } from "./ActiveFilterBar";

beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const allTags = [
  { id: "1", name: "ガチ勢", slug: "hardcore" },
  { id: "2", name: "エンジョイ勢", slug: "casual" },
  { id: "3", name: "深夜勢", slug: "late_night" },
];

describe("ActiveFilterBar", () => {
  it("renders placeholder text when no tags are selected", () => {
    render(
      <ActiveFilterBar selectedTags={[]} allTags={allTags} onRemove={vi.fn()} />
    );
    expect(screen.getByText("タグの選択なし")).toBeTruthy();
  });

  it("renders selected tag chips", () => {
    render(
      <ActiveFilterBar
        selectedTags={["hardcore", "late_night"]}
        allTags={allTags}
        onRemove={vi.fn()}
      />
    );
    expect(screen.getByText("ガチ勢")).toBeTruthy();
    expect(screen.getByText("深夜勢")).toBeTruthy();
    expect(screen.queryByText("エンジョイ勢")).toBeNull();
  });

  it("calls onRemove when × button is clicked", () => {
    const onRemove = vi.fn();
    render(
      <ActiveFilterBar
        selectedTags={["hardcore"]}
        allTags={allTags}
        onRemove={onRemove}
      />
    );
    fireEvent.click(screen.getByLabelText("ガチ勢を解除"));
    expect(onRemove).toHaveBeenCalledWith("hardcore");
  });
});
