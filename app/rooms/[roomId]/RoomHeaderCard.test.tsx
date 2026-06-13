import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />,
}));

vi.mock("@/components/ui/GamePicker", () => ({
  GameCover: ({ game }: { game: { name: string } }) => (
    <div data-testid="game-cover">{game.name}</div>
  ),
}));

vi.mock("@/components/ui/PlayStyleTag", () => ({
  PlayStyleTag: ({ tag }: { tag: { name: string } }) => (
    <span data-testid="play-style-tag">{tag.name}</span>
  ),
}));

import { RoomHeaderCard } from "./RoomHeaderCard";

const baseRoom = {
  game: { id: "g1", name: "Valorant", coverImageUrl: null },
  title: "一緒にランク上げましょう",
  description: null,
  playStyleTags: [],
  createdAt: "2026-04-12T10:00:00.000Z",
  status: "waiting" as const,
};

describe("RoomHeaderCard", () => {
  it("ゲーム名とルームタイトルが表示される", () => {
    render(<RoomHeaderCard room={baseRoom} />);
    // ゲーム名は GameCover モックと <p> の両方に出るため getAllByText で確認
    expect(screen.getAllByText("Valorant").length).toBeGreaterThan(0);
    expect(screen.getByText("一緒にランク上げましょう")).toBeInTheDocument();
  });

  it("waiting ステータスで「募集中」バッジが表示される", () => {
    render(<RoomHeaderCard room={baseRoom} />);
    expect(screen.getByText("募集中")).toBeInTheDocument();
  });

  it("playing ステータスで「プレイ中」バッジが表示される", () => {
    render(<RoomHeaderCard room={{ ...baseRoom, status: "playing" }} />);
    expect(screen.getByText("プレイ中")).toBeInTheDocument();
  });

  it("closed ステータスで「終了」バッジが表示される", () => {
    render(<RoomHeaderCard room={{ ...baseRoom, status: "closed" }} />);
    expect(screen.getByText("終了")).toBeInTheDocument();
  });

  it("description が null のときは説明文が表示されない", () => {
    const { container } = render(<RoomHeaderCard room={baseRoom} />);
    expect(container.querySelector("p.mt-2")).toBeNull();
  });

  it("description がある場合は表示される", () => {
    render(<RoomHeaderCard room={{ ...baseRoom, description: "初心者歓迎です" }} />);
    expect(screen.getByText("初心者歓迎です")).toBeInTheDocument();
  });

  it("playStyleTags がある場合はタグが表示される", () => {
    const tags = [
      { id: "t1", name: "カジュアル", slug: "casual", category: null },
      { id: "t2", name: "初心者OK", slug: "beginner-ok", category: null },
    ];
    render(<RoomHeaderCard room={{ ...baseRoom, playStyleTags: tags }} />);
    const tagElements = screen.getAllByTestId("play-style-tag");
    expect(tagElements).toHaveLength(2);
    expect(tagElements[0]).toHaveTextContent("カジュアル");
    expect(tagElements[1]).toHaveTextContent("初心者OK");
  });

  it("coverImageUrl がある場合は背景画像が描画される", () => {
    const { container } = render(
      <RoomHeaderCard
        room={{ ...baseRoom, game: { ...baseRoom.game, coverImageUrl: "/cover.jpg" } }}
      />
    );
    // aria-hidden な img のため container.querySelector で確認
    expect(container.querySelector("img")).toBeInTheDocument();
  });

  it("coverImageUrl が null の場合は背景画像が描画されない", () => {
    const { container } = render(<RoomHeaderCard room={baseRoom} />);
    expect(container.querySelector("img")).toBeNull();
  });
});
