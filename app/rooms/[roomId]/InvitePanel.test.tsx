import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("@phosphor-icons/react", () => ({
  LinkSimple: () => <span data-testid="icon-link" />,
  Copy: () => <span data-testid="icon-copy" />,
  CircleNotch: () => <span data-testid="icon-spinner" />,
  Check: () => <span data-testid="icon-check" />,
}));

vi.mock("@/lib/api/rooms", () => ({
  generateInviteToken: vi.fn(),
}));

// window.location.origin の設定
Object.defineProperty(window, "location", {
  value: { origin: "http://localhost:3000" },
  writable: true,
});

import { generateInviteToken } from "@/lib/api/rooms";
import { InvitePanel } from "./InvitePanel";

const mockGenerateInviteToken = vi.mocked(generateInviteToken);

beforeEach(() => {
  vi.clearAllMocks();
  Object.assign(navigator, {
    clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

describe("InvitePanel", () => {
  it("マウント時にスピナーが表示される", () => {
    mockGenerateInviteToken.mockReturnValue(new Promise(() => {})); // pending
    render(<InvitePanel roomId="room-1" />);
    expect(screen.getByTestId("icon-spinner")).toBeInTheDocument();
  });

  it("マウント時に generateInviteToken が呼ばれる", async () => {
    mockGenerateInviteToken.mockResolvedValue({ data: { inviteToken: "abc123" } });
    render(<InvitePanel roomId="room-1" />);
    await waitFor(() => expect(mockGenerateInviteToken).toHaveBeenCalledWith("room-1"));
  });

  it("トークン取得後に「リンクをコピー」ボタンが表示される", async () => {
    mockGenerateInviteToken.mockResolvedValue({ data: { inviteToken: "abc123" } });
    render(<InvitePanel roomId="room-1" />);
    await waitFor(() => {
      expect(screen.getByText("リンクをコピー")).toBeInTheDocument();
    });
  });

  it("取得失敗時はコンポーネントが何も表示しない", async () => {
    mockGenerateInviteToken.mockRejectedValue(new Error("失敗"));
    const { container } = render(<InvitePanel roomId="room-1" />);
    await waitFor(() => expect(screen.queryByTestId("icon-spinner")).not.toBeInTheDocument());
    expect(container.firstChild).toBeNull();
  });

  it("「リンクをコピー」クリックで clipboard.writeText が正しいURLで呼ばれる", async () => {
    mockGenerateInviteToken.mockResolvedValue({ data: { inviteToken: "token-xyz" } });
    render(<InvitePanel roomId="room-1" />);

    await waitFor(() => screen.getByText("リンクをコピー"));
    fireEvent.click(screen.getByText("リンクをコピー"));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      "http://localhost:3000/rooms/room-1?inviteToken=token-xyz"
    );
  });

  it("コピー後に「コピーしました」に変わる", async () => {
    mockGenerateInviteToken.mockResolvedValue({ data: { inviteToken: "token-xyz" } });
    render(<InvitePanel roomId="room-1" />);

    await waitFor(() => screen.getByText("リンクをコピー"));
    fireEvent.click(screen.getByText("リンクをコピー"));

    await waitFor(() => {
      expect(screen.getByText("コピーしました")).toBeInTheDocument();
    });
  });
});
