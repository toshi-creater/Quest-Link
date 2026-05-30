"use client";

import { useEffect, useRef } from "react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { useChatStore } from "@/lib/stores/chatStore";

type Props = {
  currentUserId: string | null;
  currentGuestSessionId: string | null;
};

export function ChatMessageList({ currentUserId, currentGuestSessionId }: Props) {
  const messages = useChatStore((s) => s.messages);
  const bottomRef = useRef<HTMLDivElement>(null);

  // メッセージ追加時に自動スクロール
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, [messages]);

  return (
    <>
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

          const isMe =
            (currentUserId !== null && msg.user?.id === currentUserId) ||
            (currentGuestSessionId !== null && msg.guestSessionId === currentGuestSessionId);
          const isGuest = msg.user === null && !msg.isSystem;
          const senderName = isGuest ? (msg.displayName ?? "ゲスト") : (msg.user?.username ?? "");
          return (
            <div
              key={msg.id}
              className={`flex flex-col gap-1 ${isMe ? "items-end" : "items-start"} ${msg.isNew ? "animate-slide-in-bottom" : ""}`}
            >
              <div className={`flex items-end gap-2 max-w-[70%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                {!isMe && !isGuest && msg.user && (
                  <UserAvatar
                    username={msg.user.username}
                    iconUrl={msg.user.iconUrl}
                    size="sm"
                  />
                )}
                <div
                  className={`min-w-0 ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}
                >
                  {!isMe && (isGuest || msg.user) && (
                    <span className="flex items-center gap-1 truncate text-xs" style={{ color: "var(--text-muted)" }}>
                      {senderName}
                      {isGuest && (
                        <span
                          className="inline-block rounded px-1 text-[10px] font-semibold leading-4"
                          style={{
                            backgroundColor: "rgba(139, 92, 246, 0.15)",
                            color: "#a78bfa",
                            border: "1px solid rgba(139, 92, 246, 0.3)",
                          }}
                        >
                          ゲスト
                        </span>
                      )}
                    </span>
                  )}
                  <div
                    className="rounded-2xl px-3 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap"
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
                  paddingLeft: isMe || isGuest ? undefined : "40px",
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
    </>
  );
}
