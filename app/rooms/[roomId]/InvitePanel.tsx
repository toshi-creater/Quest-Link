"use client";

import { useState, useEffect } from "react";
import { LinkSimple, Copy, CircleNotch, Check } from "@phosphor-icons/react";
import { generateInviteToken } from "@/lib/api/rooms";

type Props = { roomId: string };

export function InvitePanel({ roomId }: Props) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    generateInviteToken(roomId)
      .then((res) => {
        setInviteUrl(`${window.location.origin}/rooms/${roomId}?inviteToken=${res.data.inviteToken}`);
      })
      .catch(() => {/* 取得失敗時は非表示 */})
      .finally(() => setIsLoading(false));
  }, [roomId]);

  const handleCopy = () => {
    if (!inviteUrl) return;
    void navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  if (!isLoading && !inviteUrl) return null;

  return (
    <div
      className="rounded-xl border px-5 py-4"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <LinkSimple className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            招待リンク
          </span>
        </div>
        {isLoading ? (
          <CircleNotch className="h-4 w-4 animate-spin" style={{ color: "var(--text-muted)" }} />
        ) : (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80 active:scale-[0.97]"
            style={{
              borderColor: copied ? "var(--accent)" : "var(--border)",
              color: copied ? "var(--accent-light)" : "var(--text-secondary)",
              backgroundColor: copied ? "rgba(124,58,237,0.08)" : "transparent",
            }}
            title="コピー"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "コピーしました" : "リンクをコピー"}
          </button>
        )}
      </div>
    </div>
  );
}
