import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GridGamePicker } from "./GamePicker";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

const MOCK_GAMES = [
  { id: "game-1", name: "Apex Legends", coverImageUrl: "https://example.com/apex.jpg" },
  { id: "game-2", name: "Valorant", coverImageUrl: "https://example.com/valorant.jpg" },
  { id: "game-3", name: "Minecraft", coverImageUrl: "https://example.com/mc.jpg" },
];

function mockFetchSuccess() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      json: () => Promise.resolve({ data: MOCK_GAMES }),
    })
  );
}

function mockFetchFailure() {
  vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")));
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("GridGamePicker", () => {
  it("初期状態でローディングを表示する", () => {
    mockFetchSuccess();
    render(<GridGamePicker value={[]} onChange={() => undefined} />);
    expect(screen.getByText("読み込み中...")).toBeInTheDocument();
  });

  it("fetch 成功後にゲーム一覧を表示する", async () => {
    mockFetchSuccess();
    render(<GridGamePicker value={[]} onChange={() => undefined} />);

    await waitFor(() => {
      expect(screen.getByText("Apex Legends")).toBeInTheDocument();
      expect(screen.getByText("Valorant")).toBeInTheDocument();
      expect(screen.getByText("Minecraft")).toBeInTheDocument();
    });
  });

  it("検索クエリでゲームをフィルタリングする", async () => {
    mockFetchSuccess();
    render(<GridGamePicker value={[]} onChange={() => undefined} />);

    await waitFor(() => expect(screen.getByText("Apex Legends")).toBeInTheDocument());

    fireEvent.change(screen.getByPlaceholderText("ゲームを検索..."), {
      target: { value: "apex" },
    });

    expect(screen.getByText("Apex Legends")).toBeInTheDocument();
    expect(screen.queryByText("Valorant")).not.toBeInTheDocument();
    expect(screen.queryByText("Minecraft")).not.toBeInTheDocument();
  });

  it("ゲームをクリックすると onChange が呼ばれる", async () => {
    mockFetchSuccess();
    const onChange = vi.fn();
    render(<GridGamePicker value={[]} onChange={onChange} />);

    await waitFor(() => expect(screen.getByText("Apex Legends")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Apex Legends").closest("button")!);
    expect(onChange).toHaveBeenCalledWith([MOCK_GAMES[0]]);
  });

  it("選択済みのゲームを再クリックすると解除される", async () => {
    mockFetchSuccess();
    const onChange = vi.fn();
    render(<GridGamePicker value={[MOCK_GAMES[0]]} onChange={onChange} />);

    await waitFor(() => expect(screen.getByText("Apex Legends")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Apex Legends").closest("button")!);
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it("max 上限に達したらそれ以上選択できない", async () => {
    mockFetchSuccess();
    const onChange = vi.fn();
    render(
      <GridGamePicker
        value={[MOCK_GAMES[0], MOCK_GAMES[1]]}
        onChange={onChange}
        max={2}
      />
    );

    await waitFor(() => expect(screen.getByText("Minecraft")).toBeInTheDocument());

    fireEvent.click(screen.getByText("Minecraft").closest("button")!);
    expect(onChange).not.toHaveBeenCalled();
  });

  it("fetch 失敗時はゲームが表示されない（見つかりませんでした）", async () => {
    mockFetchFailure();
    render(<GridGamePicker value={[]} onChange={() => undefined} />);

    await waitFor(() => {
      expect(screen.getByText("見つかりませんでした")).toBeInTheDocument();
    });
  });
});
