"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { getSocket } from "@/lib/socket";

type Props = {
  roomId: string;
};

export function ChatInput({ roomId }: Props) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) return;
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
      className="border-t p-4"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div
        className="flex items-end gap-3 rounded-xl border p-2 focus-within:border-purple-500 transition-colors"
        style={{ backgroundColor: "var(--bg-input)", borderColor: "var(--border)" }}
      >
        <textarea
          rows={1}
          placeholder="メッセージを入力... (Enterで送信, Shift+Enterで改行)"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-gray-600"
          style={{ color: "var(--text-primary)", maxHeight: "120px" }}
        />
        <button
          onClick={handleSend}
          disabled={!message.trim()}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-all disabled:opacity-40"
          style={{
            background: message.trim()
              ? "linear-gradient(135deg, var(--accent), #6d28d9)"
              : "var(--border)",
            color: message.trim() ? "#fff" : "var(--text-muted)",
          }}
          aria-label="送信"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
