import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PlayStyleTag } from "./PlayStyleTag";

const tag = { id: "t1", name: "ガチ", slug: "serious" };

describe("PlayStyleTag", () => {
  it("タグ名が表示される", () => {
    render(<PlayStyleTag tag={tag} />);
    expect(screen.getByText("ガチ")).toBeInTheDocument();
  });

  it('size="sm" のとき px-2 クラスが付与される', () => {
    render(<PlayStyleTag tag={tag} size="sm" />);
    expect(screen.getByText("ガチ")).toHaveClass("px-2");
  });

  it('size="md"（デフォルト）のとき px-3 クラスが付与される', () => {
    render(<PlayStyleTag tag={tag} />);
    expect(screen.getByText("ガチ")).toHaveClass("px-3");
  });

  it("className prop がマージされる", () => {
    render(<PlayStyleTag tag={tag} className="custom-class" />);
    expect(screen.getByText("ガチ")).toHaveClass("custom-class");
  });
});
