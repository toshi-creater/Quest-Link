"use client";

import { useState, useEffect } from "react";
import { LinkSimple, Copy, CircleNotch } from "@phosphor-icons/react";
import { generateInviteToken } from "@/lib/api/rooms";
import { toast } from "@/lib/toast";

type Props = { roomId: string };

export function InvitePanel({ roomId }: Props) {
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    generateInviteToken(roomId)
      .then((res) => {
        setInviteUrl(`${window.location.origin}/rooms/${roomId}?inviteToken=${res.data.inviteToken}`);
      })
      .catch((err: unknown) => {
        toast.error(err instanceof Error ? err.message : "招待リンクの取得に失敗しました");
      })
      .finally(() => setIsLoading(false));
  }, [roomId]);

  const handleCopy = () => {
    if (!inviteUrl) return;
    void navigator.clipboard
      .writeText(inviteUrl)
      .then(() => {
        toast.success("リンクをコピーしました");
      })
      .catch(() => {
        toast.error("コピーに失敗しました");
      });
  };

  if (!isLoading && !inviteUrl) return null;

  return (
    <div
      className="rounded-xl px-5 py-4"
      style={{ backgroundColor: "var(--bg-card)" }}
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
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:opacity-80 active:scale-[0.97]"
            style={{
              color: "var(--text-secondary)",
              backgroundColor: "var(--bg-card-hover)",
            }}
            title="コピー"
          >
            <Copy className="h-3.5 w-3.5" />
            リンクをコピー
          </button>
        )}
      </div>
    </div>
  );
}
