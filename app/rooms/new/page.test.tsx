import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { toast } from "@/lib/toast";
import NewRoomPage from "./page";

// ─── vi.mock ファクトリ内で参照できるようにホイスト ────────────────────────────
const { mockPush, mockMutate, mutationCallbacks } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockMutate: vi.fn(),
  mutationCallbacks: {} as {
    onSuccess?: (data: { data: { id: string } }) => void;
    onError?: (err: Error) => void;
  },
}));

// ─── モック ───────────────────────────────────────────────────────────────────
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("next/image", () => ({
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: () => ({ data: [] }),
  useMutation: (opts: {
    mutationFn: unknown;
    onSuccess: (data: { data: { id: string } }) => void;
    onError: (err: Error) => void;
  }) => {
    mutationCallbacks.onSuccess = opts.onSuccess;
    mutationCallbacks.onError = opts.onError;
    return { mutate: mockMutate, isPending: false };
  },
}));

vi.mock("@/app/games/GamesGrid", () => ({
  GamesGrid: ({ onSelect }: { onSelect: (game: { id: string; name: string; coverImageUrl: null }) => void }) => (
    <button
      data-testid="game-picker"
      onClick={() => onSelect({ id: "g1", name: "Apex Legends", coverImageUrl: null })}
    >
      ゲームを選ぶ
    </button>
  ),
}));

vi.mock("@/lib/api/rooms", () => ({ createRoom: vi.fn() }));

vi.mock("@phosphor-icons/react", () => ({
  Plus: () => null,
  Minus: () => null,
  CircleNotch: () => null,
  ArrowLeft: () => null,
  GameController: () => null,
}));

vi.mock("@/components/ui/TagFilterToggle", () => ({
  TagFilterToggle: () => null,
}));
vi.mock("@/components/ui/TagFilterPanel", () => ({
  TagFilterPanel: () => null,
}));
vi.mock("@/components/ui/ActiveFilterBar", () => ({
  ActiveFilterBar: () => null,
}));

// ─── ヘルパー ─────────────────────────────────────────────────────────────────
function selectGame() {
  fireEvent.click(screen.getByTestId("game-picker"));
}

// ─── テスト ───────────────────────────────────────────────────────────────────
describe("NewRoomPage", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockMutate.mockReset();
  });

  it("初期表示でステップ1（ゲーム選択）が表示される", () => {
    render(<NewRoomPage />);
    expect(screen.getByTestId("game-picker")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /作成する/ })).not.toBeInTheDocument();
  });

  it("ステップインジケーターに「ゲーム選択」「部屋詳細」ラベルが表示される", () => {
    render(<NewRoomPage />);
    expect(screen.getByText("ゲーム選択")).toBeInTheDocument();
    expect(screen.getByText("部屋詳細")).toBeInTheDocument();
  });

  it("ゲームを選択するとステップ2に遷移し選択ゲーム名が表示される", () => {
    render(<NewRoomPage />);
    selectGame();
    expect(screen.queryByTestId("game-picker")).not.toBeInTheDocument();
    expect(screen.getByText("Apex Legends")).toBeInTheDocument();
    expect(screen.getByText("選択中のゲーム")).toBeInTheDocument();
  });

  it("ステップ2でステップ1インジケーターが完了状態（✓）になる", () => {
    render(<NewRoomPage />);
    selectGame();
    expect(screen.getByText("✓")).toBeInTheDocument();
  });

  it("「戻る」ボタンでステップ1に戻る", () => {
    render(<NewRoomPage />);
    selectGame();
    fireEvent.click(screen.getByRole("button", { name: /戻る/ }));
    expect(screen.getByTestId("game-picker")).toBeInTheDocument();
  });

  it("タイトル未入力では「作成する」ボタンが無効", () => {
    render(<NewRoomPage />);
    selectGame();
    expect(screen.getByRole("button", { name: /作成する/ })).toBeDisabled();
  });

  it("タイトル入力後は「作成する」ボタンが有効になる", () => {
    render(<NewRoomPage />);
    selectGame();
    fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "テスト部屋" } });
    expect(screen.getByRole("button", { name: /作成する/ })).not.toBeDisabled();
  });

  it("フォーム送信で createRoom が正しい引数（gameId, title, maxPlayers）で呼ばれる", () => {
    render(<NewRoomPage />);
    selectGame();
    fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "テスト部屋" } });
    fireEvent.click(screen.getByRole("button", { name: /作成する/ }));
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        gameId: "g1",
        title: "テスト部屋",
        maxPlayers: 4,
      })
    );
  });

  it("createRoom 成功時に router.push が呼ばれる", async () => {
    render(<NewRoomPage />);
    selectGame();
    act(() => {
      mutationCallbacks.onSuccess?.({ data: { id: "room-123" } });
    });
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/rooms/room-123");
    });
  });

  it("createRoom 成功後にフォームがリセットされステップ1に戻る", async () => {
    render(<NewRoomPage />);
    selectGame();
    fireEvent.change(screen.getAllByRole("textbox")[0], { target: { value: "テスト部屋" } });
    act(() => {
      mutationCallbacks.onSuccess?.({ data: { id: "room-123" } });
    });
    await waitFor(() => {
      expect(screen.getByTestId("game-picker")).toBeInTheDocument();
    });
    expect(mockPush).toHaveBeenCalledWith("/rooms/room-123");
  });

  it("createRoom 失敗時に toast.error が呼ばれる", async () => {
    render(<NewRoomPage />);
    selectGame();
    act(() => {
      mutationCallbacks.onError?.(new Error("作成に失敗しました"));
    });
    await waitFor(() => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith("作成に失敗しました");
    });
  });
});
