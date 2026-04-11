import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useChatStore } from "@/lib/stores/chatStore";

const mockSocket = vi.hoisted(() => ({
  connect: vi.fn(),
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
}));

const mockDisconnectSocket = vi.hoisted(() => vi.fn());

vi.mock("@/lib/socket", () => ({
  getSocket: () => mockSocket,
  disconnectSocket: mockDisconnectSocket,
}));

import { useSocketRoom } from "./useSocketRoom";

const defaultOptions = {
  roomId: "room-1",
  initialMessages: [],
  initialParticipants: [],
};

function getSocketHandler(event: string): ((...args: unknown[]) => void) | undefined {
  return mockSocket.on.mock.calls.find(([e]) => e === event)?.[1] as
    | ((...args: unknown[]) => void)
    | undefined;
}

beforeEach(() => {
  vi.clearAllMocks();
  useChatStore.setState({
    messages: [],
    participants: [],
    connectionStatus: "disconnected",
  });
});

describe("useSocketRoom", () => {
  describe("初期化", () => {
    it("マウント時にストアへ initialMessages と initialParticipants が注入される", () => {
      const initialMessages = [
        {
          id: "m1",
          roomId: "room-1",
          user: null,
          content: "hi",
          isSystem: true,
          createdAt: new Date("2026-01-01T00:00:00Z"),
        },
      ];
      const initialParticipants = [
        {
          userId: "u1",
          isHost: false,
          user: { username: "Alice", iconUrl: null, avgRating: null },
        },
      ];

      // 安定した参照を renderHook コールバック外で宣言し無限ループを防ぐ
      renderHook(() =>
        useSocketRoom({ roomId: "room-1", initialMessages, initialParticipants })
      );

      const state = useChatStore.getState();
      expect(state.messages).toEqual(initialMessages);
      expect(state.participants).toEqual(initialParticipants);
    });

    it("マウント時に socket.connect() が呼ばれ connectionStatus が connecting になる", () => {
      renderHook(() => useSocketRoom(defaultOptions));
      expect(mockSocket.connect).toHaveBeenCalledOnce();
      expect(useChatStore.getState().connectionStatus).toBe("connecting");
    });
  });

  describe("接続イベント", () => {
    it("connect イベントで connectionStatus が connected になり room:join を emit する", () => {
      renderHook(() => useSocketRoom(defaultOptions));

      act(() => getSocketHandler("connect")?.());

      expect(useChatStore.getState().connectionStatus).toBe("connected");
      expect(mockSocket.emit).toHaveBeenCalledWith("room:join", { roomId: "room-1" });
    });

    it("connect_error イベントで connectionStatus が error になる", () => {
      renderHook(() => useSocketRoom(defaultOptions));

      act(() => getSocketHandler("connect_error")?.());

      expect(useChatStore.getState().connectionStatus).toBe("error");
    });

    it("reconnect_failed イベントで connectionStatus が failed になる", () => {
      renderHook(() => useSocketRoom(defaultOptions));

      act(() => getSocketHandler("reconnect_failed")?.());

      expect(useChatStore.getState().connectionStatus).toBe("failed");
    });

    it("disconnect イベントで connectionStatus が disconnected になる", () => {
      renderHook(() => useSocketRoom(defaultOptions));
      useChatStore.setState({ connectionStatus: "connected" });

      act(() => getSocketHandler("disconnect")?.());

      expect(useChatStore.getState().connectionStatus).toBe("disconnected");
    });
  });

  describe("チャットイベント", () => {
    it("chat:message イベントでメッセージがストアに追加される", () => {
      renderHook(() => useSocketRoom(defaultOptions));

      act(() =>
        getSocketHandler("chat:message")?.({
          id: "m1",
          roomId: "room-1",
          user: null,
          content: "hello",
          isSystem: false,
          createdAt: "2026-01-01T00:00:00Z",
        })
      );

      const { messages } = useChatStore.getState();
      expect(messages).toHaveLength(1);
      expect(messages[0].createdAt).toBeInstanceOf(Date);
    });

    it("chat:message の createdAt が Date オブジェクトに変換される", () => {
      renderHook(() => useSocketRoom(defaultOptions));
      const isoString = "2026-06-15T10:30:00Z";

      act(() =>
        getSocketHandler("chat:message")?.({
          id: "m2",
          roomId: "room-1",
          user: null,
          content: "test",
          isSystem: false,
          createdAt: isoString,
        })
      );

      const { messages } = useChatStore.getState();
      expect(messages[0].createdAt).toEqual(new Date(isoString));
    });
  });

  describe("参加者イベント", () => {
    it("room:user_joined イベントで参加者がストアに追加される", () => {
      renderHook(() => useSocketRoom(defaultOptions));

      act(() =>
        getSocketHandler("room:user_joined")?.({
          userId: "u1",
          username: "Alice",
          iconUrl: null,
          avgRating: 4.0,
        })
      );

      expect(useChatStore.getState().participants).toHaveLength(1);
    });

    it("room:user_left イベントで参加者がストアから除去される", () => {
      // initialParticipants で設定する（setState だとマウント時の setInitial に上書きされるため）
      const initialParticipants = [
        { userId: "u1", isHost: false, user: { username: "Alice", iconUrl: null, avgRating: null } },
        { userId: "u2", isHost: false, user: { username: "Bob", iconUrl: null, avgRating: null } },
      ];

      renderHook(() => useSocketRoom({ ...defaultOptions, initialParticipants }));

      act(() => getSocketHandler("room:user_left")?.({ userId: "u1" }));

      const { participants } = useChatStore.getState();
      expect(participants).toHaveLength(1);
      expect(participants[0].userId).toBe("u2");
    });

    it("room:host_changed イベントで isHost が正しく更新される", () => {
      // initialParticipants で設定する（setState だとマウント時の setInitial に上書きされるため）
      const initialParticipants = [
        { userId: "u1", isHost: true, user: { username: "Alice", iconUrl: null, avgRating: null } },
        { userId: "u2", isHost: false, user: { username: "Bob", iconUrl: null, avgRating: null } },
      ];

      renderHook(() => useSocketRoom({ ...defaultOptions, initialParticipants }));

      act(() => getSocketHandler("room:host_changed")?.({ newHostId: "u2" }));

      const { participants } = useChatStore.getState();
      expect(participants.find((p) => p.userId === "u1")?.isHost).toBe(false);
      expect(participants.find((p) => p.userId === "u2")?.isHost).toBe(true);
    });
  });

  describe("クリーンアップ", () => {
    it("アンマウント時に room:leave を emit する", () => {
      const { unmount } = renderHook(() => useSocketRoom(defaultOptions));
      unmount();
      expect(mockSocket.emit).toHaveBeenCalledWith("room:leave", { roomId: "room-1" });
    });

    it("アンマウント時にすべてのイベントリスナーが off される", () => {
      const { unmount } = renderHook(() => useSocketRoom(defaultOptions));
      unmount();

      const offEvents = mockSocket.off.mock.calls.map(([e]) => e);
      expect(offEvents).toContain("connect");
      expect(offEvents).toContain("connect_error");
      expect(offEvents).toContain("reconnect_failed");
      expect(offEvents).toContain("disconnect");
      expect(offEvents).toContain("chat:message");
      expect(offEvents).toContain("room:user_joined");
      expect(offEvents).toContain("room:user_left");
      expect(offEvents).toContain("room:host_changed");
      expect(offEvents).toContain("room:closed");
    });

    it("アンマウント時に disconnectSocket が呼ばれる", () => {
      const { unmount } = renderHook(() => useSocketRoom(defaultOptions));
      unmount();
      expect(mockDisconnectSocket).toHaveBeenCalledOnce();
    });
  });
});
