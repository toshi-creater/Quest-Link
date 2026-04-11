import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/components/ui/PlayStyleTag", () => ({
  PlayStyleTag: ({ tag }: { tag: { name: string } }) => <span>{tag.name}</span>,
}));

vi.mock("@/components/ui/StarRating", () => ({
  RatingDisplay: () => <div data-testid="rating-display" />,
}));

import { ProfileInfo } from "./ProfileInfo";

const defaultProps = {
  username: "testuser",
  avgRating: 4.2,
  ratingCount: 10,
  playStyleTags: [{ id: "t1", name: "ガチ", slug: "serious" }],
  bio: null,
};

describe("ProfileInfo", () => {
  it("ユーザー名が表示される", () => {
    render(<ProfileInfo {...defaultProps} />);
    expect(screen.getByText("testuser")).toBeInTheDocument();
  });

  it("RatingDisplay が表示される", () => {
    render(<ProfileInfo {...defaultProps} />);
    expect(screen.getByTestId("rating-display")).toBeInTheDocument();
  });

  it("playStyleTags が表示される", () => {
    render(<ProfileInfo {...defaultProps} />);
    expect(screen.getByText("ガチ")).toBeInTheDocument();
  });

  it("bio がある場合にテキストが表示される", () => {
    render(<ProfileInfo {...defaultProps} bio="自己紹介文" />);
    expect(screen.getByText("自己紹介文")).toBeInTheDocument();
  });

  it("bio が null で bioFallback がある場合にフォールバックが表示される", () => {
    render(<ProfileInfo {...defaultProps} bioFallback="自己紹介はまだありません" />);
    expect(screen.getByText("自己紹介はまだありません")).toBeInTheDocument();
  });

  it("bio が null で bioFallback もない場合は何も表示されない", () => {
    render(<ProfileInfo {...defaultProps} />);
    expect(screen.queryByText("自己紹介はまだありません")).not.toBeInTheDocument();
  });

  it("playStyleTags が空の場合はタグが表示されない", () => {
    render(<ProfileInfo {...defaultProps} playStyleTags={[]} />);
    expect(screen.queryByText("ガチ")).not.toBeInTheDocument();
  });
});
