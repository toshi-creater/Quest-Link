import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GamesSearchBar } from "./GamesSearchBar";
import { GamesQueryProvider } from "./GamesQueryContext";

vi.mock("@phosphor-icons/react", () => ({
  MagnifyingGlass: () => null,
}));

describe("GamesSearchBar", () => {
  it("検索バーが表示される", () => {
    render(
      <GamesQueryProvider>
        <GamesSearchBar />
      </GamesQueryProvider>
    );
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("入力値が context の query に反映される", () => {
    render(
      <GamesQueryProvider>
        <GamesSearchBar />
      </GamesQueryProvider>
    );
    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Apex" } });
    expect(input).toHaveValue("Apex");
  });
});
