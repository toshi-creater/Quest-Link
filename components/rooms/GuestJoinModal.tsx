"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";

const ERROR_MESSAGES: Record<string, string> = {
  ROOM_CLOSED: "この部屋はすでに終了しています",
  ROOM_FULL: "この部屋は満員です",
  INVITE_NOT_FOUND: "招待リンクが無効です",
  ALREADY_JOINED: "すでにこの部屋に参加しています",
};

type Props =
  | { mode: "invite"; roomId: string; inviteToken: string; onClose: () => void }
  | { mode: "newUserError"; roomId: string; inviteToken: string };

export function GuestJoinModal(props: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const callbackUrl = `/rooms/${props.roomId}?inviteToken=${props.inviteToken}`;

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.length > 50) {
      setError("表示名は50文字以内で入力してください");
      return;
    }
    setIsPending(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/invite/${props.inviteToken}/join`, {
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
      await queryClient.invalidateQueries({ queryKey: ["room", props.roomId] });
      router.push(`/rooms/${props.roomId}/chat`);
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setIsPending(false);
    }
  };

  const handleBackdropClick = props.mode === "invite" ? props.onClose : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div
        className="w-full max-w-sm rounded-2xl border p-6 space-y-5 animate-scale-in"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        onClick={(e) => e.stopPropagation()}
      >
        {props.mode === "invite" && (
          <>
            <div className="space-y-1">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                参加するにはログインが必要です
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                アカウントをお持ちでない方はゲストとして参加できます
              </p>
            </div>

            {/* OAuth */}
            <div className="space-y-2.5">
              <button
                onClick={() => signIn("google", { callbackUrl })}
                className="flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all hover:shadow-md active:scale-[0.97]"
                style={{ backgroundColor: "#fff", borderColor: "#dadce0", color: "#3c4043" }}
              >
                <svg width="16" height="16" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z" />
                  <path fill="#34A853" d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z" />
                  <path fill="#FBBC05" d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z" />
                  <path fill="#EA4335" d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.31z" />
                </svg>
                Googleでログイン
              </button>
              <button
                onClick={() => signIn("twitter", { callbackUrl })}
                className="flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all hover:opacity-80 active:scale-[0.97]"
                style={{ backgroundColor: "#000", borderColor: "#333", color: "#fff" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                X（Twitter）でログイン
              </button>
              <button
                onClick={() => signIn("discord", { callbackUrl })}
                className="flex w-full items-center justify-center gap-3 rounded-xl border px-4 py-3 text-sm font-medium transition-all hover:opacity-80 active:scale-[0.97]"
                style={{ backgroundColor: "#5865F2", borderColor: "#4752c4", color: "#fff" }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Discordでログイン
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                または
              </span>
              <div className="h-px flex-1" style={{ backgroundColor: "var(--border)" }} />
            </div>

            {/* Guest join */}
            <form onSubmit={handleGuestSubmit} className="space-y-3">
              <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
                ゲストで参加
              </p>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="表示名（任意・最大50文字）"
                maxLength={50}
                className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
                style={{
                  backgroundColor: "var(--bg-input)",
                  borderColor: "var(--border)",
                  color: "var(--text-primary)",
                }}
              />
              {error && <p className="text-sm text-red-400">{error}</p>}
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-lg border px-4 py-2.5 text-sm font-medium transition-all hover:opacity-80 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
              >
                {isPending ? "参加中..." : "ゲストとして参加"}
              </button>
            </form>
          </>
        )}

        {props.mode === "newUserError" && (
          <>
            <div className="space-y-1">
              <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
                招待リンクでの新規登録はできません
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                アカウント登録後にログインしてから参加してください。
              </p>
            </div>
            <Link
              href="/onboarding"
              className="flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all hover:opacity-90 active:scale-[0.97]"
              style={{ backgroundColor: "var(--accent)", color: "white" }}
            >
              プロフィールを設定して参加
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
