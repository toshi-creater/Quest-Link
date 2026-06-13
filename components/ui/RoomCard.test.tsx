import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import type { RoomSummary } from "@/lib/api/rooms";

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock("./GamePicker", () => ({
  GameCover: () => <div data-testid="game-cover" />,
}));

vi.mock("./StarRating", () => ({
  RatingDisplay: () => <div data-testid="rating-display" />,
}));

vi.mock("./UserAvatar", () => ({
  UserAvatar: () => <div data-testid="user-avatar" />,
}));

vi.mock("@phosphor-icons/react", () => ({
  Users: () => <span />,
}));

import { RoomCard } from "./RoomCard";

const mockRoom: RoomSummary = {
  id: "room-1",
  title: "テストルーム",
  description: "説明文",
  game: { id: "g1", name: "Apex Legends", coverImageUrl: null },
  maxPlayers: 3,
  currentPlayers: 2,
  status: "waiting",
  playStyleTags: [{ id: "t1", name: "ガチ", slug: "serious", category: null }],
  host: { id: "u1", username: "testuser", iconUrl: null, avgRating: 4.5 },
  createdAt: "2026-03-11T00:00:00Z",
};

describe("RoomCard", () => {
  it("ルームタイトルが表示される", () => {
    render(<RoomCard room={mockRoom} />);
    expect(screen.getByText("テストルーム")).toBeInTheDocument();
  });

  it("ゲーム名が表示される", () => {
    render(<RoomCard room={mockRoom} />);
    expect(screen.getByText("Apex Legends")).toBeInTheDocument();
  });

  it("ホストのユーザー名が表示される", () => {
    render(<RoomCard room={mockRoom} />);
    expect(screen.getByText("testuser")).toBeInTheDocument();
  });

  it("プレイヤー数が「2/3」形式で表示される", () => {
    render(<RoomCard room={mockRoom} />);
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("/3")).toBeInTheDocument();
  });

  it("PlayStyleTag のタグ名が表示される", () => {
    render(<RoomCard room={mockRoom} />);
    expect(screen.getByText("ガチ")).toBeInTheDocument();
  });

  it('status="waiting" のとき「募集中」が表示される', () => {
    render(<RoomCard room={mockRoom} />);
    expect(screen.getByText("募集中")).toBeInTheDocument();
  });

  it('status="closed" のとき「終了」が表示される', () => {
    render(<RoomCard room={{ ...mockRoom, status: "closed" }} />);
    expect(screen.getByText("終了")).toBeInTheDocument();
  });

  it("リンクの href が /rooms/room-1 になっている", () => {
    render(<RoomCard room={mockRoom} />);
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "/rooms/room-1");
  });

  it("説明・タグなしでも card-body コンテナが DOM に存在する", () => {
    render(<RoomCard room={{ ...mockRoom, description: null, playStyleTags: [] }} />);
    expect(screen.getByTestId("card-body")).toBeInTheDocument();
  });

  it("説明・タグなしのとき説明文とタグが表示されない", () => {
    render(<RoomCard room={{ ...mockRoom, description: null, playStyleTags: [] }} />);
    expect(screen.queryByText("説明文")).not.toBeInTheDocument();
    expect(screen.queryByText("ガチ")).not.toBeInTheDocument();
  });
});
