import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { useChatStore, type ChatMessage } from "@/lib/stores/chatStore";

vi.mock("@/components/ui/UserAvatar", () => ({
  UserAvatar: ({ username }: { username: string }) => (
    <span data-testid="user-avatar" aria-label={username} />
  ),
}));

vi.mock("@phosphor-icons/react", () => ({
  Flag: () => <span data-testid="icon-flag" />,
}));

vi.mock("@/components/users/ReportModal", () => ({
  ReportModal: () => <div data-testid="report-modal" />,
}));

vi.mock("@/lib/hooks/useMyBlocks", () => ({
  useMyBlocks: () => new Set<string>(),
}));

// jsdom は scrollIntoView を実装していないためモックする
Element.prototype.scrollIntoView = vi.fn();

import { ChatMessageList } from "./ChatMessageList";

const makeMsg = (overrides: Partial<ChatMessage> = {}): ChatMessage => ({
  id: "m1",
  roomId: "room-1",
  user: { id: "u1", username: "Alice", iconUrl: null },
  content: "こんにちは",
  isSystem: false,
  createdAt: new Date("2026-01-01T12:00:00Z"),
  ...overrides,
});

beforeEach(() => {
  useChatStore.setState({ messages: [], participants: [], connectionStatus: "disconnected" });
});

describe("ChatMessageList", () => {
  describe("空状態", () => {
    it("メッセージがない場合に案内文が表示される", () => {
      render(<ChatMessageList currentUserId="u1" currentGuestSessionId={null} />);
      expect(
        screen.getByText("まだメッセージはありません。最初のメッセージを送りましょう！")
      ).toBeInTheDocument();
    });

    it("メッセージがある場合は案内文が表示されない", () => {
      useChatStore.setState({ messages: [makeMsg()] });
      render(<ChatMessageList currentUserId="u1" currentGuestSessionId={null} />);
      expect(
        screen.queryByText("まだメッセージはありません。最初のメッセージを送りましょう！")
      ).not.toBeInTheDocument();
    });
  });

  describe("システムメッセージ", () => {
    it("isSystem=true のメッセージが表示される", () => {
      useChatStore.setState({
        messages: [makeMsg({ id: "s1", isSystem: true, content: "Aliceが参加しました", user: null })],
      });
      render(<ChatMessageList currentUserId="u1" currentGuestSessionId={null} />);
      expect(screen.getByText("Aliceが参加しました")).toBeInTheDocument();
    });

    it("isSystem=true のメッセージにアバターが表示されない", () => {
      useChatStore.setState({
        messages: [makeMsg({ id: "s1", isSystem: true, content: "システム通知", user: null })],
      });
      render(<ChatMessageList currentUserId="u1" currentGuestSessionId={null} />);
      expect(screen.queryByTestId("user-avatar")).not.toBeInTheDocument();
    });
  });

  describe("ユーザーメッセージ", () => {
    it("メッセージ本文が表示される", () => {
      useChatStore.setState({ messages: [makeMsg()] });
      render(<ChatMessageList currentUserId="u2" currentGuestSessionId={null} />);
      expect(screen.getByText("こんにちは")).toBeInTheDocument();
    });

    it("他人のメッセージでは送信者名が表示される", () => {
      useChatStore.setState({
        messages: [makeMsg({ user: { id: "u2", username: "Bob", iconUrl: null } })],
      });
      render(<ChatMessageList currentUserId="u1" currentGuestSessionId={null} />);
      expect(screen.getByText("Bob")).toBeInTheDocument();
    });

    it("他人のメッセージではアバターが表示される", () => {
      useChatStore.setState({
        messages: [makeMsg({ user: { id: "u2", username: "Bob", iconUrl: null } })],
      });
      render(<ChatMessageList currentUserId="u1" currentGuestSessionId={null} />);
      expect(screen.getByTestId("user-avatar")).toBeInTheDocument();
    });

    it("自分（currentUserId 一致）のメッセージでは送信者名が表示されない", () => {
      useChatStore.setState({
        messages: [makeMsg({ user: { id: "u1", username: "Alice", iconUrl: null } })],
      });
      render(<ChatMessageList currentUserId="u1" currentGuestSessionId={null} />);
      expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    });

    it("自分のメッセージではアバターが表示されない", () => {
      useChatStore.setState({
        messages: [makeMsg({ user: { id: "u1", username: "Alice", iconUrl: null } })],
      });
      render(<ChatMessageList currentUserId="u1" currentGuestSessionId={null} />);
      expect(screen.queryByTestId("user-avatar")).not.toBeInTheDocument();
    });

    it("改行を含むメッセージ本文が whitespace-pre-wrap クラスで描画される", () => {
      useChatStore.setState({
        messages: [makeMsg({ content: "line1\nline2" })],
      });
      const { container } = render(<ChatMessageList currentUserId="u2" currentGuestSessionId={null} />);
      const msgEl = container.querySelector(".whitespace-pre-wrap");
      expect(msgEl).not.toBeNull();
      expect(msgEl?.textContent).toContain("line1");
      expect(msgEl?.textContent).toContain("line2");
    });
  });

  describe("ゲストメッセージ", () => {
    it("user=null のメッセージには「ゲスト」バッジが表示される", () => {
      useChatStore.setState({
        messages: [
          makeMsg({
            user: null,
            guestSessionId: "gs1",
            displayName: "ゲストさん",
            isSystem: false,
          }),
        ],
      });
      render(<ChatMessageList currentUserId="u1" currentGuestSessionId={null} />);
      expect(screen.getByText("ゲスト")).toBeInTheDocument();
    });

    it("ゲストメッセージに displayName が表示される", () => {
      useChatStore.setState({
        messages: [
          makeMsg({ user: null, guestSessionId: "gs1", displayName: "ゲストA", isSystem: false }),
        ],
      });
      render(<ChatMessageList currentUserId="u1" currentGuestSessionId={null} />);
      expect(screen.getByText("ゲストA")).toBeInTheDocument();
    });

    it("currentGuestSessionId が一致するゲストのメッセージは自分として扱われ送信者名が表示されない", () => {
      useChatStore.setState({
        messages: [
          makeMsg({ user: null, guestSessionId: "gs-me", displayName: "私", isSystem: false }),
        ],
      });
      render(<ChatMessageList currentUserId={null} currentGuestSessionId="gs-me" />);
      expect(screen.queryByText("私")).not.toBeInTheDocument();
    });
  });

  describe("複数メッセージ", () => {
    it("複数のメッセージがすべて表示される", () => {
      useChatStore.setState({
        messages: [
          makeMsg({ id: "1", content: "メッセージ1" }),
          makeMsg({ id: "2", content: "メッセージ2", user: { id: "u2", username: "Bob", iconUrl: null } }),
          makeMsg({ id: "3", isSystem: true, content: "Bobが参加しました", user: null }),
        ],
      });
      render(<ChatMessageList currentUserId="u1" currentGuestSessionId={null} />);
      expect(screen.getByText("メッセージ1")).toBeInTheDocument();
      expect(screen.getByText("メッセージ2")).toBeInTheDocument();
      expect(screen.getByText("Bobが参加しました")).toBeInTheDocument();
    });
  });
});
