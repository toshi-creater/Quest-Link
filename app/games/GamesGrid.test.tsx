import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GamesGrid } from "./GamesGrid";

const MOCK_GAMES = [
  { id: "g1", name: "Apex Legends", coverImageUrl: null },
  { id: "g2", name: "Valorant", coverImageUrl: null },
  { id: "g3", name: "Minecraft", coverImageUrl: null },
];

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

vi.mock("@/components/ui/GameCoverImage", () => ({
  GameCoverImage: () => null,
}));

vi.mock("@phosphor-icons/react", () => ({
  MagnifyingGlass: () => null,
}));

function mockFetchSuccess(games = MOCK_GAMES) {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: games }),
    })
  );
}

describe("GamesGrid", () => {
  beforeEach(() => {
    mockPush.mockReset();
    vi.unstubAllGlobals();
  });

  it("games prop 未指定時に /api/v1/games をフェッチしてゲーム一覧を表示する", async () => {
    mockFetchSuccess();
    render(<GamesGrid />);
    await waitFor(() => {
      expect(screen.getByText("Apex Legends")).toBeInTheDocument();
    });
    expect(vi.mocked(fetch)).toHaveBeenCalledWith("/api/v1/games");
  });

  it("games prop を渡した場合はフェッチせずそのゲームを表示する", () => {
    const mockFetch = vi.fn();
    vi.stubGlobal("fetch", mockFetch);
    render(<GamesGrid games={MOCK_GAMES} />);
    expect(screen.getByText("Apex Legends")).toBeInTheDocument();
    expect(screen.getByText("Valorant")).toBeInTheDocument();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("onSelect 未指定時、ゲームクリックで router.push が呼ばれる", () => {
    render(<GamesGrid games={MOCK_GAMES} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(mockPush).toHaveBeenCalledWith("/games/g1/rooms");
  });

  it("onSelect 指定時、ゲームクリックで onSelect が呼ばれ router.push は呼ばれない", () => {
    const mockOnSelect = vi.fn();
    render(<GamesGrid games={MOCK_GAMES} onSelect={mockOnSelect} />);
    fireEvent.click(screen.getAllByRole("button")[0]);
    expect(mockOnSelect).toHaveBeenCalledWith(MOCK_GAMES[0]);
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("onSelect 指定時、オーバーレイテキストが「選択する →」になる", () => {
    render(<GamesGrid games={MOCK_GAMES} onSelect={vi.fn()} />);
    expect(screen.getAllByText("選択する →").length).toBeGreaterThan(0);
    expect(screen.queryByText("部屋を探す →")).not.toBeInTheDocument();
  });

  it("onSelect 未指定時、オーバーレイテキストが「部屋を探す →」になる", () => {
    render(<GamesGrid games={MOCK_GAMES} />);
    expect(screen.getAllByText("部屋を探す →").length).toBeGreaterThan(0);
    expect(screen.queryByText("選択する →")).not.toBeInTheDocument();
  });

  it("onSelect 指定時、roomCounts があっても募集数テキストが表示されない", () => {
    const roomCounts = { g1: 3, g2: 0, g3: 1 };
    render(<GamesGrid games={MOCK_GAMES} roomCounts={roomCounts} onSelect={vi.fn()} />);
    expect(screen.queryByText("3 部屋募集中")).not.toBeInTheDocument();
    expect(screen.queryByText("募集なし")).not.toBeInTheDocument();
  });

});
