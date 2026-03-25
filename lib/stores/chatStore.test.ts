import { describe, it, expect, beforeEach } from "vitest";
import { useChatStore, type ChatMessage, type Participant } from "./chatStore";

const makeMsg = (id: string): ChatMessage => ({
  id,
  roomId: "room-1",
  user: { id: "u1", username: "tester", iconUrl: null },
  content: "hello",
  isSystem: false,
  createdAt: new Date("2026-01-01T00:00:00Z"),
});

const makeParticipant = (userId: string): Participant => ({
  userId,
  isHost: false,
  user: { username: "tester", iconUrl: null, avgRating: 4.0 },
});

beforeEach(() => {
  useChatStore.setState({
    messages: [],
    participants: [],
    connectionStatus: "disconnected",
  });
});

describe("chatStore", () => {
  describe("setInitial", () => {
    it("messages と participants が置き換わる", () => {
      const msgs = [makeMsg("1"), makeMsg("2")];
      const participants = [makeParticipant("u1"), makeParticipant("u2")];
      useChatStore.getState().setInitial(msgs, participants);
      const state = useChatStore.getState();
      expect(state.messages).toEqual(msgs);
      expect(state.participants).toEqual(participants);
    });
  });

  describe("addMessage", () => {
    it("messages に追加される", () => {
      const msg = makeMsg("1");
      useChatStore.getState().addMessage(msg);
      expect(useChatStore.getState().messages).toEqual([{ ...msg, isNew: true }]);
    });

    it("複数回呼ぶと順序が保たれる", () => {
      const msg1 = makeMsg("1");
      const msg2 = makeMsg("2");
      const msg3 = makeMsg("3");
      useChatStore.getState().addMessage(msg1);
      useChatStore.getState().addMessage(msg2);
      useChatStore.getState().addMessage(msg3);
      expect(useChatStore.getState().messages).toEqual([
        { ...msg1, isNew: true },
        { ...msg2, isNew: true },
        { ...msg3, isNew: true },
      ]);
    });

    it("同一 id のメッセージは重複追加されない", () => {
      const msg = makeMsg("dup-1");
      useChatStore.getState().addMessage(msg);
      useChatStore.getState().addMessage(msg);
      expect(useChatStore.getState().messages).toHaveLength(1);
    });
  });

  describe("addParticipant", () => {
    it("新規参加者が追加される", () => {
      useChatStore.getState().addParticipant({
        userId: "u1",
        username: "tester",
        iconUrl: null,
        avgRating: 4.0,
      });
      const { participants } = useChatStore.getState();
      expect(participants).toHaveLength(1);
      expect(participants[0].userId).toBe("u1");
    });

    it("同一 userId は追加されない（重複排除）", () => {
      useChatStore.getState().addParticipant({
        userId: "u1",
        username: "tester",
        iconUrl: null,
        avgRating: 4.0,
      });
      useChatStore.getState().addParticipant({
        userId: "u1",
        username: "tester",
        iconUrl: null,
        avgRating: 4.0,
      });
      expect(useChatStore.getState().participants).toHaveLength(1);
    });
  });

  describe("removeParticipant", () => {
    it("指定 userId が除去される", () => {
      useChatStore.setState({ participants: [makeParticipant("u1"), makeParticipant("u2")] });
      useChatStore.getState().removeParticipant("u1");
      const { participants } = useChatStore.getState();
      expect(participants).toHaveLength(1);
      expect(participants[0].userId).toBe("u2");
    });
  });

  describe("setConnectionStatus", () => {
    it("status が変わる", () => {
      useChatStore.getState().setConnectionStatus("connected");
      expect(useChatStore.getState().connectionStatus).toBe("connected");
    });
  });
});
