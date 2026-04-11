"use client";

import Link from "next/link";
import { ArrowLeft } from "@phosphor-icons/react";
import { useChatStore, type ChatMessage, type Participant } from "@/lib/stores/chatStore";
import { useSocketRoom } from "./useSocketRoom";
import { ChatParticipantList } from "./ChatParticipantList";
import { ChatMessageList } from "./ChatMessageList";
import { ChatInput } from "./ChatInput";

type Tag = { id: string; name: string; slug: string };

type Props = {
  roomId: string;
  currentUserId: string | null;
  currentGuestSessionId: string | null;
  initialMessages: ChatMessage[];
  initialParticipants: Participant[];
  roomInfo: {
    title: string;
    maxPlayers: number;
    game: { name: string };
    tags: Tag[];
  };
};

export function ChatView({
  roomId,
  currentUserId,
  currentGuestSessionId,
  initialMessages,
  initialParticipants,
  roomInfo,
}: Props) {
  useSocketRoom({ roomId, initialMessages, initialParticipants });

  const connectionStatus = useChatStore((s) => s.connectionStatus);
  const currentPlayers = useChatStore((s) => s.participants.length);

  return (
    <div
      className="fixed inset-x-0 top-0 bottom-[calc(60px_+_env(safe-area-inset-bottom))] z-30 flex flex-col md:top-16 md:bottom-0 md:flex-row"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <ChatParticipantList
        roomId={roomId}
        currentUserId={currentUserId}
        currentGuestSessionId={currentGuestSessionId}
        maxPlayers={roomInfo.maxPlayers}
        roomTitle={roomInfo.title}
        gameName={roomInfo.game.name}
        tags={roomInfo.tags}
      />

      {/* Chat area */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0">
        {/* Mobile header */}
        <div
          className="flex items-center gap-3 border-b px-4 py-3 md:hidden"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <Link href={`/rooms/${roomId}`} style={{ color: "var(--text-secondary)" }}>
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {roomInfo.title}
            </p>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {currentPlayers}人参加中
            </p>
          </div>
        </div>

        {/* Connection error banner */}
        {(connectionStatus === "error" || connectionStatus === "failed") && (
          <div
            className="flex items-center gap-2 border-b px-4 py-2 text-sm animate-slide-in-bottom"
            style={{
              backgroundColor: "rgba(239, 68, 68, 0.1)",
              borderColor: "rgba(239, 68, 68, 0.3)",
              color: "#f87171",
            }}
          >
            <span className="h-2 w-2 shrink-0 rounded-full bg-red-500 animate-pulse-dot" />
            {connectionStatus === "failed"
              ? "チャットサーバーへの接続に失敗しました。ページを再読み込みしてください。"
              : "チャットサーバーに接続できません。再接続を試みています…"}
          </div>
        )}

        <ChatMessageList
          currentUserId={currentUserId}
          currentGuestSessionId={currentGuestSessionId}
        />
        <ChatInput roomId={roomId} />
      </div>
    </div>
  );
}
