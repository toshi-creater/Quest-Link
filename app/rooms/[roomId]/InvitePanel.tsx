"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { LinkSimple, Copy, Prohibit, CircleNotch, Check } from "@phosphor-icons/react";
import { generateInviteToken, invalidateInviteToken } from "@/lib/api/rooms";

type Props = { roomId: string };

export function InvitePanel({ roomId }: Props) {
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const inviteUrl = inviteToken
    ? `${window.location.origin}/rooms/${roomId}?inviteToken=${inviteToken}`
    : null;

  const generateMutation = useMutation({
    mutationFn: () => generateInviteToken(roomId),
    onSuccess: (res) => setInviteToken(res.data.inviteToken),
  });

  const invalidateMutation = useMutation({
    mutationFn: () => invalidateInviteToken(roomId),
    onSuccess: () => setInviteToken(null),
  });

  const handleCopy = () => {
    if (!inviteUrl) return;
    void navigator.clipboard.writeText(inviteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div
      className="rounded-xl border px-5 py-4 space-y-3"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="flex items-center gap-2">
        <LinkSimple className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
        <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
          招待リンク
        </span>
      </div>

      {!inviteUrl ? (
        <div className="flex flex-col gap-2">
          <button
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
            className="flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-all hover:opacity-80 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              borderColor: "var(--border)",
              color: "var(--text-secondary)",
              backgroundColor: "var(--bg-card)",
            }}
          >
            {generateMutation.isPending ? (
              <CircleNotch className="h-4 w-4 animate-spin" />
            ) : (
              <LinkSimple className="h-4 w-4" />
            )}
            招待リンクを生成
          </button>
          {generateMutation.isError && (
            <p className="text-center text-xs animate-slide-in-bottom" style={{ color: "#f87171" }}>
              {generateMutation.error.message}
            </p>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <div
            className="flex items-center gap-2 rounded-lg border px-3 py-2"
            style={{ borderColor: "var(--border)", backgroundColor: "rgba(124,58,237,0.06)" }}
          >
            <span
              className="flex-1 truncate text-xs font-mono"
              style={{ color: "var(--text-secondary)" }}
            >
              {inviteUrl}
            </span>
            <button
              onClick={handleCopy}
              className="shrink-0 rounded p-1 transition-colors hover:opacity-80"
              style={{ color: copied ? "var(--accent-light)" : "var(--text-muted)" }}
              title="コピー"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => invalidateMutation.mutate()}
              disabled={invalidateMutation.isPending}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 px-4 py-2 text-xs font-medium text-red-400 transition-all hover:bg-red-500/10 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "rgba(239,68,68,0.05)" }}
            >
              {invalidateMutation.isPending ? (
                <CircleNotch className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Prohibit className="h-3.5 w-3.5" />
              )}
              リンクを無効化
            </button>
            {invalidateMutation.isError && (
              <p className="text-center text-xs animate-slide-in-bottom" style={{ color: "#f87171" }}>
                {invalidateMutation.error.message}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
