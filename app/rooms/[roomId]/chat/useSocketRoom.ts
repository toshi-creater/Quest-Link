"use client";

import { useEffect } from "react";
import { getSocket, connectSocket, disconnectSocket } from "@/lib/socket";
import { useChatStore, type ChatMessage, type Participant } from "@/lib/stores/chatStore";

type UseSocketRoomOptions = {
  roomId: string;
  initialMessages: ChatMessage[];
  initialParticipants: Participant[];
  currentUserId: string | null;
  currentGuestSessionId: string | null;
};

export function useSocketRoom({
  roomId,
  initialMessages,
  initialParticipants,
  currentUserId,
  currentGuestSessionId,
}: UseSocketRoomOptions): void {
  const { setInitial, addMessage, addParticipant, removeParticipant, removeParticipantByGuest, setKicked, setConnectionStatus } =
    useChatStore();

  // 初期データをストアへ注入
  useEffect(() => {
    setInitial(initialMessages, initialParticipants);
  }, [initialMessages, initialParticipants, setInitial]);

  // Socket 接続ライフサイクル
  useEffect(() => {
    const socket = getSocket();

    setConnectionStatus("connecting");
    void connectSocket();

    socket.on("connect", () => {
      setConnectionStatus("connected");
      socket.emit("room:join", { roomId });
    });

    socket.on("connect_error", () => {
      setConnectionStatus("error");
    });

    socket.on("reconnect_failed", () => {
      setConnectionStatus("failed");
    });

    socket.on("disconnect", () => {
      setConnectionStatus("disconnected");
    });

    socket.on("chat:message", (msg: ChatMessage) => {
      addMessage({ ...msg, createdAt: new Date(msg.createdAt) });
    });

    socket.on(
      "room:user_joined",
      (p: { userId: string; username: string; iconUrl: string | null; avgRating: number }) => {
        addParticipant(p);
      }
    );

    socket.on("room:user_left", ({ userId }: { userId: string }) => {
      removeParticipant(userId);
    });

    socket.on(
      "room:user_kicked",
      ({
        kickedUserId,
        kickedGuestSessionId,
      }: {
        kickedUserId: string | null;
        kickedGuestSessionId: string | null;
        byHostId: string;
        kickedAt: string;
      }) => {
        const isMeKicked =
          (kickedUserId != null && kickedUserId === currentUserId) ||
          (kickedGuestSessionId != null && kickedGuestSessionId === currentGuestSessionId);

        if (isMeKicked) {
          setKicked();
        } else if (kickedUserId != null) {
          removeParticipant(kickedUserId);
        } else if (kickedGuestSessionId != null) {
          removeParticipantByGuest(kickedGuestSessionId);
        }
      }
    );

    socket.on("room:host_changed", ({ newHostId }: { newHostId: string }) => {
      useChatStore.setState((state) => ({
        participants: state.participants.map((p) => ({
          ...p,
          isHost: p.userId != null && p.userId === newHostId,
        })),
      }));
    });

    socket.on("room:closed", () => {
      // 部屋が閉じられたときの処理は page レベルで対応
    });

    return () => {
      socket.emit("room:leave", { roomId });
      socket.off("connect");
      socket.off("connect_error");
      socket.off("reconnect_failed");
      socket.off("disconnect");
      socket.off("chat:message");
      socket.off("room:user_joined");
      socket.off("room:user_left");
      socket.off("room:host_changed");
      socket.off("room:closed");
      socket.off("room:user_kicked");
      disconnectSocket();
    };
  }, [roomId, currentUserId, currentGuestSessionId, addMessage, addParticipant, removeParticipant, removeParticipantByGuest, setKicked, setConnectionStatus]);
}
