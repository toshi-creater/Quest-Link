import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("@/components/ui/UserAvatar", () => ({
  UserAvatar: () => <div data-testid="user-avatar" />,
}));

vi.mock("@/components/ui/StarRating", () => ({
  StarRating: () => <div data-testid="star-rating" />,
}));

vi.mock("@phosphor-icons/react", () => ({
  Star: () => <span />,
}));

import { ReceivedRatingsList } from "./ReceivedRatingsList";

const makeRating = (id: string, username: string | null, comment: string | null = null) => ({
  id,
  score: 4,
  comment,
  createdAt: "2026-04-01T00:00:00Z",
  reviewer: { username, iconUrl: null },
});

const ratings = [
  makeRating("r1", "user1", "良いプレイヤーです"),
  makeRating("r2", "user2"),
  makeRating("r3", "user3"),
  makeRating("r4", "user4"),
];

describe("ReceivedRatingsList", () => {
  it("ratings が空のとき「まだ評価がありません」が表示される", () => {
    render(<ReceivedRatingsList ratings={[]} />);
    expect(screen.getByText("まだ評価がありません")).toBeInTheDocument();
  });

  it("レビュアーのユーザー名が表示される", () => {
    render(<ReceivedRatingsList ratings={[makeRating("r1", "testuser")]} />);
    expect(screen.getByText("testuser")).toBeInTheDocument();
  });

  it("username が null のとき「退会済みユーザー」が表示される", () => {
    render(<ReceivedRatingsList ratings={[makeRating("r1", null)]} />);
    expect(screen.getByText("退会済みユーザー")).toBeInTheDocument();
  });

  it("comment があるとき表示される", () => {
    render(<ReceivedRatingsList ratings={[makeRating("r1", "user1", "良いです")]} />);
    expect(screen.getByText("良いです")).toBeInTheDocument();
  });

  it("3件以下のときは「すべて見る」ボタンが表示されない", () => {
    render(<ReceivedRatingsList ratings={ratings.slice(0, 3)} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("4件以上のとき最初は3件だけ表示され「すべて見る」ボタンが表示される", () => {
    render(<ReceivedRatingsList ratings={ratings} />);
    expect(screen.getByText("すべて見る（4件）")).toBeInTheDocument();
    expect(screen.queryByText("user4")).not.toBeInTheDocument();
  });

  it("「すべて見る」クリックで全件表示され「折りたたむ」に変わる", async () => {
    const user = userEvent.setup();
    render(<ReceivedRatingsList ratings={ratings} />);
    await user.click(screen.getByText("すべて見る（4件）"));
    expect(screen.getByText("user4")).toBeInTheDocument();
    expect(screen.getByText("折りたたむ")).toBeInTheDocument();
  });

  it("「折りたたむ」クリックで3件に戻る", async () => {
    const user = userEvent.setup();
    render(<ReceivedRatingsList ratings={ratings} />);
    await user.click(screen.getByText("すべて見る（4件）"));
    await user.click(screen.getByText("折りたたむ"));
    expect(screen.queryByText("user4")).not.toBeInTheDocument();
    expect(screen.getByText("すべて見る（4件）")).toBeInTheDocument();
  });
});
