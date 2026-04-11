"use client";

import { useEffect } from "react";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { useChatStore, type ChatMessage, type Participant } from "@/lib/stores/chatStore";

type UseSocketRoomOptions = {
  roomId: string;
  initialMessages: ChatMessage[];
  initialParticipants: Participant[];
};

export function useSocketRoom({ roomId, initialMessages, initialParticipants }: UseSocketRoomOptions): void {
  const { setInitial, addMessage, addParticipant, removeParticipant, setConnectionStatus } =
    useChatStore();

  // 初期データをストアへ注入
  useEffect(() => {
    setInitial(initialMessages, initialParticipants);
  }, [initialMessages, initialParticipants, setInitial]);

  // Socket 接続ライフサイクル
  useEffect(() => {
    const socket = getSocket();

    setConnectionStatus("connecting");
    socket.connect();

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
      disconnectSocket();
    };
  }, [roomId, addMessage, addParticipant, removeParticipant, setConnectionStatus]);
}
