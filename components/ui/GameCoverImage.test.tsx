import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GameCoverImage } from "./GameCoverImage";

vi.mock("next/image", () => ({
  default: ({
    src,
    alt,
    onError,
    className,
  }: {
    src: string;
    alt: string;
    onError?: () => void;
    className?: string;
  }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} onError={onError} className={className} />
  ),
}));

describe("GameCoverImage", () => {
  describe("固定サイズモード (size あり)", () => {
    it("coverImageUrl が null の場合フォールバックコンテナを表示する", () => {
      render(<GameCoverImage coverImageUrl={null} name="Apex Legends" size="md" />);
      expect(screen.queryByRole("img")).toBeNull();
    });

    it("coverImageUrl がある場合に img を表示する", () => {
      render(
        <GameCoverImage
          coverImageUrl="https://example.com/apex.jpg"
          name="Apex Legends"
          size="md"
        />
      );
      expect(screen.getByRole("img", { name: "Apex Legends" })).toBeInTheDocument();
    });

    it("画像ロードエラー時にフォールバックコンテナを表示する", () => {
      render(
        <GameCoverImage
          coverImageUrl="https://example.com/broken.jpg"
          name="Broken Game"
          size="sm"
        />
      );

      const img = screen.getByRole("img", { name: "Broken Game" });
      fireEvent.error(img);

      expect(screen.queryByRole("img")).toBeNull();
    });

    it.each(["sm", "md", "lg"] as const)("size=%s が渡されたとき img が表示される", (size) => {
      render(
        <GameCoverImage
          coverImageUrl="https://example.com/game.jpg"
          name="Some Game"
          size={size}
        />
      );
      expect(screen.getByRole("img", { name: "Some Game" })).toBeInTheDocument();
    });
  });

  describe("fill モード (size なし)", () => {
    it("coverImageUrl が null の場合フォールバックコンテナを表示する", () => {
      render(<GameCoverImage coverImageUrl={null} name="Apex Legends" />);
      expect(screen.queryByRole("img")).toBeNull();
    });

    it("coverImageUrl がある場合に img を表示する", () => {
      render(
        <GameCoverImage
          coverImageUrl="https://example.com/apex.jpg"
          name="Apex Legends"
        />
      );
      expect(screen.getByRole("img", { name: "Apex Legends" })).toBeInTheDocument();
    });

    it("画像ロードエラー時にフォールバックコンテナを表示する", () => {
      render(
        <GameCoverImage
          coverImageUrl="https://example.com/broken.jpg"
          name="Broken Game"
        />
      );

      const img = screen.getByRole("img", { name: "Broken Game" });
      fireEvent.error(img);

      expect(screen.queryByRole("img")).toBeNull();
    });

    it("className が fill モードのラッパー div に適用される", () => {
      const { container } = render(
        <GameCoverImage
          coverImageUrl={null}
          name="Some Game"
          className="custom-class"
        />
      );
      expect(container.firstChild).toHaveClass("custom-class");
    });
  });
});
