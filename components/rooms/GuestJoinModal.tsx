"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const ERROR_MESSAGES: Record<string, string> = {
  ROOM_CLOSED: "この部屋はすでに終了しています",
  ROOM_FULL: "この部屋は満員です",
  INVITE_NOT_FOUND: "招待リンクが無効です",
  ALREADY_JOINED: "すでにこの部屋に参加しています",
};

type Props = {
  roomId: string;
  inviteToken: string;
};

export function GuestJoinModal({ roomId, inviteToken }: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.length > 50) {
      setError("表示名は50文字以内で入力してください");
      return;
    }
    setIsPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/invite/${inviteToken}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ displayName }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: { code: string } };
        setError(ERROR_MESSAGES[body.error?.code ?? ""] ?? "参加に失敗しました");
        return;
      }
      router.push(`/rooms/${roomId}/chat`);
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-sm rounded-2xl border p-6 space-y-5"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
          ゲストとして参加
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm" style={{ color: "var(--text-secondary)" }}>
              表示名（任意・最大50文字）
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="表示名（空白の場合は自動設定）"
              maxLength={50}
              className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              style={{
                backgroundColor: "var(--bg-input)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all hover:opacity-90 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--accent)", color: "white" }}
          >
            {isPending ? "参加中..." : "参加する"}
          </button>
        </form>
      </div>
    </div>
  );
}
