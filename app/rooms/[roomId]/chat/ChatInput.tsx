"use client";

import { useState } from "react";
import { PaperPlaneTilt } from "@phosphor-icons/react";
import { getSocket } from "@/lib/socket";
import { useChatStore } from "@/lib/stores/chatStore";

const MAX_LENGTH = 1000;

type Props = {
  roomId: string;
};

export function ChatInput({ roomId }: Props) {
  const [message, setMessage] = useState("");
  const connectionStatus = useChatStore((s) => s.connectionStatus);

  const isDisconnected = connectionStatus === "error" || connectionStatus === "failed" || connectionStatus === "disconnected";
  const canSend = message.trim().length > 0 && message.length <= MAX_LENGTH && !isDisconnected;
  const nearLimit = message.length > MAX_LENGTH * 0.8;

  const handleSend = () => {
    if (!canSend) return;
    getSocket().emit("chat:send", { roomId, content: message.trim() });
    setMessage("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      className="md:p-4 p-2"
      style={{ backgroundColor: "transparent" }}
    >
      <div
        className="flex items-end gap-3 rounded-xl border p-1.5 md:p-2 focus-within:border-[var(--accent)] transition-colors"
        style={{
          backgroundColor: "var(--bg-input)",
          borderColor: message.length > MAX_LENGTH ? "rgba(239,68,68,0.6)" : "var(--border)",
        }}
      >
        <textarea
          rows={1}
          placeholder={isDisconnected ? "接続が切れています..." : "メッセージを入力..."}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isDisconnected}
          className="flex-1 resize-none bg-transparent px-2 py-1.5 md:py-2 text-sm outline-none placeholder:text-[var(--text-muted)] disabled:opacity-50 max-h-[80px] md:max-h-[120px]"
          style={{ color: "var(--text-primary)" }}
        />
        <div className="flex flex-col items-end gap-1 shrink-0">
          {nearLimit && (
            <span
              className="text-xs leading-none"
              style={{ color: message.length > MAX_LENGTH ? "#f87171" : "var(--text-muted)" }}
            >
              {message.length}/{MAX_LENGTH}
            </span>
          )}
          <button
            onClick={handleSend}
            disabled={!canSend}
            className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-lg transition-all active:scale-90 disabled:opacity-40"
            style={{
              background: canSend
                ? "linear-gradient(135deg, var(--accent), #6d28d9)"
                : "var(--border)",
              color: canSend ? "#fff" : "var(--text-muted)",
            }}
            aria-label="送信"
          >
            <PaperPlaneTilt className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
