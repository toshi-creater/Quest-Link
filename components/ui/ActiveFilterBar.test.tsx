import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ActiveFilterBar } from "./ActiveFilterBar";

const allTags = [
  { id: "1", name: "ガチ勢", slug: "hardcore" },
  { id: "2", name: "エンジョイ勢", slug: "casual" },
  { id: "3", name: "深夜勢", slug: "late_night" },
];

describe("ActiveFilterBar", () => {
  it("renders nothing when no tags are selected", () => {
    const { container } = render(
      <ActiveFilterBar selectedTags={[]} allTags={allTags} onRemove={vi.fn()} onClearAll={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders selected tag chips", () => {
    render(
      <ActiveFilterBar
        selectedTags={["hardcore", "late_night"]}
        allTags={allTags}
        onRemove={vi.fn()}
        onClearAll={vi.fn()}
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
        onClearAll={vi.fn()}
      />
    );
    fireEvent.click(screen.getByLabelText("ガチ勢を解除"));
    expect(onRemove).toHaveBeenCalledWith("hardcore");
  });

  it("calls onClearAll when すべてクリア is clicked", () => {
    const onClearAll = vi.fn();
    render(
      <ActiveFilterBar
        selectedTags={["hardcore"]}
        allTags={allTags}
        onRemove={vi.fn()}
        onClearAll={onClearAll}
      />
    );
    fireEvent.click(screen.getByText("すべてクリア"));
    expect(onClearAll).toHaveBeenCalledOnce();
  });
});
