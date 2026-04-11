import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ProfileStats } from "./ProfileStats";

describe("ProfileStats", () => {
  it("平均評価が小数第1位で表示される", () => {
    render(<ProfileStats avgRating={4.2} ratingCount={10} />);
    expect(screen.getByText("4.2")).toBeInTheDocument();
  });

  it("avgRating が 0 のとき「-」が表示される", () => {
    render(<ProfileStats avgRating={0} ratingCount={0} />);
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("評価件数が表示される", () => {
    render(<ProfileStats avgRating={4.2} ratingCount={10} />);
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("ラベル「平均評価」と「評価件数」が表示される", () => {
    render(<ProfileStats avgRating={4.2} ratingCount={10} />);
    expect(screen.getByText("平均評価")).toBeInTheDocument();
    expect(screen.getByText("評価件数")).toBeInTheDocument();
  });
});
