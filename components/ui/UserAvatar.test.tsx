import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, act, cleanup } from "@testing-library/react";

vi.mock("next/image", () => ({
  default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => <img {...props} />, // eslint-disable-line @next/next/no-img-element
}));

import { UserAvatar } from "./UserAvatar";

afterEach(() => {
  cleanup();
});

describe("UserAvatar", () => {
  it("アイコンURLがある場合は画像を表示する", () => {
    render(<UserAvatar username="testuser" iconUrl="https://example.com/avatar.jpg" />);
    expect(screen.getByRole("img")).toBeInTheDocument();
  });

  it("アイコンURLがない場合はイニシャルを表示する", () => {
    render(<UserAvatar username="testuser" iconUrl={null} />);
    expect(screen.getByText("T")).toBeInTheDocument();
  });

  it("画像読み込みエラー時はイニシャルにフォールバックする", async () => {
    render(<UserAvatar username="testuser" iconUrl="https://example.com/avatar.jpg" />);
    await act(async () => {
      screen.getByRole("img").dispatchEvent(new Event("error", { bubbles: true }));
    });
    expect(screen.getByText("T")).toBeInTheDocument();
  });

  it("iconUrl が変わると imgError がリセットされ再度画像が表示される", async () => {
    const { rerender } = render(
      <UserAvatar username="testuser" iconUrl="https://example.com/avatar1.jpg" />
    );
    await act(async () => {
      screen.getByRole("img").dispatchEvent(new Event("error", { bubbles: true }));
    });
    expect(screen.getByText("T")).toBeInTheDocument();

    rerender(<UserAvatar username="testuser" iconUrl="https://example.com/avatar2.jpg" />);
    expect(screen.queryByText("T")).toBeNull();
    expect(screen.getByRole("img")).toBeInTheDocument();
  });
});
