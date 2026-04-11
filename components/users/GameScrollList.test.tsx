import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}));

vi.mock("@phosphor-icons/react", () => ({
  GameController: () => <span data-testid="game-controller-icon" />,
}));

import { GameScrollList } from "./GameScrollList";

const games = [
  { id: "g1", igdbId: 1, name: "Apex Legends", coverImageUrl: "https://example.com/apex.jpg" },
  { id: "g2", igdbId: 2, name: "Valorant", coverImageUrl: null },
];

describe("GameScrollList", () => {
  it("ゲーム名が表示される", () => {
    render(<GameScrollList games={games} />);
    expect(screen.getByText("Apex Legends")).toBeInTheDocument();
    expect(screen.getByText("Valorant")).toBeInTheDocument();
  });

  it("coverImageUrl がある場合は img が表示される", () => {
    render(<GameScrollList games={games} />);
    expect(screen.getByAltText("Apex Legends")).toBeInTheDocument();
  });

  it("coverImageUrl が null の場合はアイコンが表示される", () => {
    render(<GameScrollList games={games} />);
    expect(screen.getByTestId("game-controller-icon")).toBeInTheDocument();
  });

  it("games が空の場合は空状態テキストが表示される", () => {
    render(<GameScrollList games={[]} />);
    expect(screen.getByText("ゲームが設定されていません")).toBeInTheDocument();
  });

  it("セクション見出しが表示される", () => {
    render(<GameScrollList games={games} />);
    expect(screen.getByText("プレイしているゲーム")).toBeInTheDocument();
  });
});
