"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Crown } from "@phosphor-icons/react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { PlayStyleTag } from "@/components/ui/PlayStyleTag";
import { RatingDisplay } from "@/components/ui/StarRating";
import { getSocket, disconnectSocket } from "@/lib/socket";
import { useChatStore, type ChatMessage, type Participant } from "@/lib/stores/chatStore";
import { ChatInput } from "./ChatInput";

type Tag = { id: string; name: string; slug: string };

type Props = {
  roomId: string;
  currentUserId: string | null;
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
  initialMessages,
  initialParticipants,
  roomInfo,
}: Props) {
  const { messages, participants, connectionStatus, setInitial, addMessage, addParticipant, removeParticipant, setConnectionStatus } =
    useChatStore();
  const bottomRef = useRef<HTMLDivElement>(null);

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
      // 部屋が閉じられたときの処理は page レベルで対応（ここではシステムメッセージで通知）
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

  // メッセージ追加時に自動スクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages]);

  const currentPlayers = participants.length;

  return (
    <div
      className="fixed inset-x-0 top-0 bottom-[calc(60px_+_env(safe-area-inset-bottom))] z-30 flex flex-col md:top-16 md:bottom-0 md:flex-row"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      {/* Sidebar */}
      <aside
        className="hidden w-64 shrink-0 flex-col border-r md:flex"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        {/* Room info */}
        <div className="border-b p-4" style={{ borderColor: "var(--border)" }}>
          <Link
            href={`/rooms/${roomId}`}
            className="mb-3 flex items-center gap-2 text-xs transition-colors hover:text-white"
            style={{ color: "var(--text-secondary)" }}
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            部屋の詳細へ
          </Link>
          <h2 className="text-sm font-bold leading-snug" style={{ color: "var(--text-primary)" }}>
            {roomInfo.title}
          </h2>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            {roomInfo.game.name}
          </p>
          {roomInfo.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {roomInfo.tags.map((tag) => (
                <PlayStyleTag key={tag.id} tag={tag} size="sm" />
              ))}
            </div>
          )}
        </div>

        {/* Participants */}
        <div className="flex-1 overflow-y-auto p-4">
          <p
            className="mb-3 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            参加者 {currentPlayers}/{roomInfo.maxPlayers}
          </p>
          <ul className="space-y-2.5">
            {participants.map((p, idx) => {
              if (!p.user) return null;
              const { username, iconUrl, avgRating } = p.user;
              return (
                <li key={p.userId ?? `guest-${idx}`} className="flex items-center gap-2.5">
                  <div className="relative">
                    <UserAvatar username={username} iconUrl={iconUrl} size="sm" />
                    <span
                      className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2"
                      style={{ backgroundColor: "#22c55e", borderColor: "var(--bg-card)" }}
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1">
                      {p.isHost && <Crown className="h-3 w-3" style={{ color: "#eab308" }} />}
                      <span
                        className="truncate text-xs font-medium"
                        style={{
                          color:
                            p.userId != null && p.userId === currentUserId
                              ? "var(--accent-light)"
                              : "var(--text-primary)",
                        }}
                      >
                        {username}
                      </span>
                    </div>
                    <RatingDisplay
                      avgRating={avgRating !== null ? Number(avgRating) : null}
                      ratingCount={avgRating != null ? 10 : 3}
                      size="sm"
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>

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

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                まだメッセージはありません。最初のメッセージを送りましょう！
              </p>
            </div>
          )}
          {messages.map((msg) => {
            if (msg.isSystem) {
              return (
                <div key={msg.id} className={`flex items-center gap-3 ${msg.isNew ? "animate-fade-in" : ""}`}>
                  <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
                  <span className="shrink-0 text-xs" style={{ color: "var(--text-muted)" }}>
                    {msg.content}
                  </span>
                  <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
                </div>
              );
            }

            const isMe = msg.user?.id === currentUserId;
            return (
              <div
                key={msg.id}
                className={`flex flex-col gap-1 ${isMe ? "items-end" : "items-start"} ${msg.isNew ? "animate-slide-in-bottom" : ""}`}
              >
                <div className={`flex items-end gap-2 max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  {!isMe && msg.user && (
                    <UserAvatar
                      username={msg.user.username}
                      iconUrl={msg.user.iconUrl}
                      size="sm"
                    />
                  )}
                  <div
                    className={`min-w-0 ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}
                  >
                    {!isMe && msg.user && (
                      <span className="truncate text-xs" style={{ color: "var(--text-muted)" }}>
                        {msg.user.username}
                      </span>
                    )}
                    <div
                      className="rounded-2xl px-3 py-2 text-sm leading-relaxed break-words"
                      style={
                        isMe
                          ? {
                              backgroundColor: "var(--accent)",
                              color: "#fff",
                              borderBottomRightRadius: "4px",
                            }
                          : {
                              backgroundColor: "var(--bg-card)",
                              color: "var(--text-primary)",
                              border: "1px solid var(--border)",
                              borderBottomLeftRadius: "4px",
                            }
                      }
                    >
                      {msg.content}
                    </div>
                  </div>
                </div>
                <span
                  className="text-xs"
                  style={{
                    color: "var(--text-muted)",
                    paddingLeft: isMe ? undefined : "40px",
                  }}
                >
                  {new Date(msg.createdAt).toLocaleTimeString("ja-JP", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <ChatInput roomId={roomId} />
      </div>
    </div>
  );
}
