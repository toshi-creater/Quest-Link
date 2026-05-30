import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@phosphor-icons/react", () => ({
  ArrowLeft: () => <span data-testid="icon-arrow-left" />,
  CaretLeft: () => <span data-testid="icon-caret-left" />,
  Crown: () => <span data-testid="icon-crown" />,
}));

vi.mock("@/components/rooms/KickButton", () => ({
  KickButton: ({ targetName }: { targetName: string }) => (
    <button data-testid="kick-button" aria-label={`${targetName}をキック`} />
  ),
}));

vi.mock("@/lib/hooks/useMyBlocks", () => ({
  useMyBlocks: () => new Set<string>(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/ui/UserAvatar", () => ({
  UserAvatar: ({ username }: { username: string }) => (
    <span data-testid="user-avatar" aria-label={username} />
  ),
}));

vi.mock("@/components/ui/PlayStyleTag", () => ({
  PlayStyleTag: ({ tag }: { tag: { name: string } }) => <span>{tag.name}</span>,
}));

vi.mock("@/components/ui/StarRating", () => ({
  RatingDisplay: () => <span data-testid="rating-display" />,
}));

import { useChatStore } from "@/lib/stores/chatStore";
import { ChatParticipantList } from "./ChatParticipantList";

const defaultProps = {
  roomId: "room-1",
  currentUserId: "u1",
  currentGuestSessionId: null,
  isCurrentUserHost: false,
  maxPlayers: 4,
  roomTitle: "テストルーム",
  gameName: "Valorant",
  tags: [],
};

beforeEach(() => {
  useChatStore.setState({ messages: [], participants: [], connectionStatus: "disconnected", isKicked: false });
});

describe("ChatParticipantList", () => {
  describe("ルーム情報", () => {
    it("ルームタイトルが表示される", () => {
      render(<ChatParticipantList {...defaultProps} />);
      expect(screen.getByText("テストルーム")).toBeInTheDocument();
    });

    it("ゲーム名が表示される", () => {
      render(<ChatParticipantList {...defaultProps} />);
      expect(screen.getByText("Valorant")).toBeInTheDocument();
    });

    it("戻るリンクが正しい href を持つ", () => {
      render(<ChatParticipantList {...defaultProps} />);
      expect(screen.getByRole("link", { name: /戻る/ })).toHaveAttribute(
        "href",
        "/rooms/room-1"
      );
    });

    it("tags が渡されると PlayStyleTag が表示される", () => {
      const tags = [
        { id: "t1", name: "まったり", slug: "casual" },
        { id: "t2", name: "がっつり", slug: "serious" },
      ];
      render(<ChatParticipantList {...defaultProps} tags={tags} />);
      expect(screen.getByText("まったり")).toBeInTheDocument();
      expect(screen.getByText("がっつり")).toBeInTheDocument();
    });

    it("tags が空の場合は PlayStyleTag が表示されない", () => {
      render(<ChatParticipantList {...defaultProps} tags={[]} />);
      // tags セクション自体が非表示（PlayStyleTag が 0 件）
      expect(screen.queryByText("まったり")).not.toBeInTheDocument();
    });
  });

  describe("参加者数", () => {
    it("参加者数が 0 の場合に「参加者 0/4」が表示される", () => {
      render(<ChatParticipantList {...defaultProps} />);
      expect(screen.getByText("参加者 0/4")).toBeInTheDocument();
    });

    it("参加者数がストアと連動して表示される", () => {
      useChatStore.setState({
        participants: [
          { userId: "u1", isHost: false, user: { username: "Alice", iconUrl: null, avgRating: null } },
          { userId: "u2", isHost: false, user: { username: "Bob", iconUrl: null, avgRating: null } },
        ],
      });
      render(<ChatParticipantList {...defaultProps} />);
      expect(screen.getByText("参加者 2/4")).toBeInTheDocument();
    });
  });

  describe("ホスト表示", () => {
    it("isHost=true の参加者には Crown アイコンが表示される", () => {
      useChatStore.setState({
        participants: [
          { userId: "u1", isHost: true, user: { username: "Alice", iconUrl: null, avgRating: null } },
        ],
      });
      render(<ChatParticipantList {...defaultProps} />);
      expect(screen.getByTestId("icon-crown")).toBeInTheDocument();
    });

    it("isHost=false の参加者には Crown アイコンが表示されない", () => {
      useChatStore.setState({
        participants: [
          { userId: "u1", isHost: false, user: { username: "Alice", iconUrl: null, avgRating: null } },
        ],
      });
      render(<ChatParticipantList {...defaultProps} />);
      expect(screen.queryByTestId("icon-crown")).not.toBeInTheDocument();
    });
  });

  describe("ゲストバッジ", () => {
    it("user=null の参加者（ゲスト）には「ゲスト」バッジが表示される", () => {
      useChatStore.setState({
        participants: [
          {
            userId: null,
            isHost: false,
            displayName: "ゲストさん",
            guestSessionId: "gs1",
            user: null,
          },
        ],
      });
      render(<ChatParticipantList {...defaultProps} />);
      expect(screen.getByText("ゲスト")).toBeInTheDocument();
    });

    it("認証済みユーザーには「ゲスト」バッジが表示されない", () => {
      useChatStore.setState({
        participants: [
          { userId: "u1", isHost: false, user: { username: "Alice", iconUrl: null, avgRating: null } },
        ],
      });
      render(<ChatParticipantList {...defaultProps} />);
      expect(screen.queryByText("ゲスト")).not.toBeInTheDocument();
    });
  });

  describe("自分の参加者", () => {
    it("currentUserId が一致する参加者の名前が表示される", () => {
      useChatStore.setState({
        participants: [
          { userId: "u1", isHost: false, user: { username: "Alice", iconUrl: null, avgRating: null } },
        ],
      });
      render(<ChatParticipantList {...defaultProps} currentUserId="u1" />);
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });

    it("currentGuestSessionId が一致するゲスト参加者の名前が表示される", () => {
      useChatStore.setState({
        participants: [
          {
            userId: null,
            isHost: false,
            displayName: "私",
            guestSessionId: "gs-me",
            user: null,
          },
        ],
      });
      render(
        <ChatParticipantList
          {...defaultProps}
          currentUserId={null}
          currentGuestSessionId="gs-me"
        />
      );
      expect(screen.getByText("私")).toBeInTheDocument();
    });
  });
});
