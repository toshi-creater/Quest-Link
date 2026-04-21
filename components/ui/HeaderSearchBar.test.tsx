import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

const mockPush = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("@phosphor-icons/react", () => ({
  MagnifyingGlass: () => <span />,
}));

vi.mock("@/components/ui/GameCoverImage", () => ({
  GameCoverImage: ({ name }: { name: string }) => <span>{name}</span>,
}));

const mockUseGameSearch = vi.fn();
vi.mock("@/lib/hooks/useGameSearch", () => ({
  useGameSearch: (...args: unknown[]) => mockUseGameSearch(...args),
}));

import { HeaderSearchBar } from "./HeaderSearchBar";

const noResults = { results: [], loading: false };
const withResults = {
  results: [
    { id: "game1", name: "Apex Legends", coverImageUrl: null },
    { id: "game2", name: "Valorant", coverImageUrl: null },
  ],
  loading: false,
};

beforeEach(() => {
  mockPush.mockReset();
  mockUseGameSearch.mockReturnValue(noResults);
});

afterEach(() => {
  cleanup();
});

describe("HeaderSearchBar", () => {
  it('placeholder が "ゲーム or 部屋を検索..." である', () => {
    render(<HeaderSearchBar />);
    expect(
      screen.getByPlaceholderText("ゲーム or 部屋を検索..."),
    ).toBeInTheDocument();
  });

  it("空クエリではドロップダウンが開かない", () => {
    render(<HeaderSearchBar />);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("1 文字以上入力するとドロップダウンが開く", () => {
    render(<HeaderSearchBar />);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "apex" },
    });
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it('「xxx」を検索クリックで /search?q=xxx に遷移する', () => {
    render(<HeaderSearchBar />);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "apex" },
    });
    fireEvent.click(screen.getByRole("option", { name: /apex.*を検索/ }));
    expect(mockPush).toHaveBeenCalledWith("/search?q=apex");
  });

  it("ゲーム候補クリックで /games/${gameId}/rooms に遷移する", () => {
    mockUseGameSearch.mockReturnValue(withResults);
    render(<HeaderSearchBar />);
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "apex" },
    });
    fireEvent.click(screen.getByRole("option", { name: /Apex Legends/ }));
    expect(mockPush).toHaveBeenCalledWith("/games/game1/rooms");
  });

  it("Enter で /search?q=... に遷移する", () => {
    render(<HeaderSearchBar />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "apex" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockPush).toHaveBeenCalledWith("/search?q=apex");
  });

  it("空クエリの Enter では遷移しない", () => {
    render(<HeaderSearchBar />);
    fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("isComposing=true の Enter では遷移しない", () => {
    render(<HeaderSearchBar />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "apex" } });
    fireEvent.keyDown(input, { key: "Enter", isComposing: true });
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("Escape でドロップダウンが閉じる", () => {
    render(<HeaderSearchBar />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "apex" } });
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("外クリックでドロップダウンが閉じる", () => {
    render(<HeaderSearchBar />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "apex" } });
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("listbox")).toBeNull();
  });

  it("ArrowDown でハイライトが移動し aria-activedescendant が更新される", () => {
    mockUseGameSearch.mockReturnValue(withResults);
    render(<HeaderSearchBar />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "apex" } });
    expect(input).not.toHaveAttribute("aria-activedescendant");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input).toHaveAttribute("aria-activedescendant");
    const firstId = input.getAttribute("aria-activedescendant");
    fireEvent.keyDown(input, { key: "ArrowDown" });
    expect(input.getAttribute("aria-activedescendant")).not.toBe(firstId);
  });

  it("ArrowUp でハイライトが逆順に移動する", () => {
    mockUseGameSearch.mockReturnValue(withResults);
    render(<HeaderSearchBar />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "apex" } });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(input).toHaveAttribute("aria-activedescendant");
  });

  it("ArrowDown でハイライトした状態で Enter を押すとゲームに遷移する", () => {
    mockUseGameSearch.mockReturnValue(withResults);
    render(<HeaderSearchBar />);
    const input = screen.getByRole("combobox");
    fireEvent.change(input, { target: { value: "apex" } });
    // index 0: search item, index 1: Apex Legends
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(mockPush).toHaveBeenCalledWith("/games/game1/rooms");
  });

  it("useGameSearch に limit=8 / fetchOnEmpty=false が渡される", () => {
    render(<HeaderSearchBar />);
    expect(mockUseGameSearch).toHaveBeenCalledWith("", {
      limit: 8,
      fetchOnEmpty: false,
    });
  });
});
