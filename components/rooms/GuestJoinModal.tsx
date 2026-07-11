"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useQueryClient } from "@tanstack/react-query";
import { OAuthButtonGroup } from "@/components/ui/OAuthButtonGroup";
import { toast } from "@/lib/toast";

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
  const [isPending, setIsPending] = useState(false);

  const callbackUrl = `/rooms/${props.roomId}?inviteToken=${props.inviteToken}`;

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (displayName.length > 50) {
      toast.error("表示名は50文字以内で入力してください");
      return;
    }
    setIsPending(true);
    try {
      const res = await fetch(`/api/v1/invite/${props.inviteToken}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ displayName }),
      });
      if (!res.ok) {
        const body = (await res.json()) as { error?: { code: string } };
        toast.error(ERROR_MESSAGES[body.error?.code ?? ""] ?? "参加に失敗しました");
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ["room", props.roomId] });
      router.push(`/rooms/${props.roomId}/chat`);
    } catch {
      toast.error("ネットワークエラーが発生しました");
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
        className="w-full max-w-sm rounded-2xl p-6 space-y-5 animate-scale-in"
        style={{ backgroundColor: "var(--bg-card)" }}
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
            <OAuthButtonGroup
              onSignIn={(provider) => signIn(provider, { callbackUrl })}
            />

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
                className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                style={{
                  backgroundColor: "var(--bg-input)",
                  color: "var(--text-primary)",
                }}
              />
              <button
                type="submit"
                disabled={isPending}
                className="w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all hover:opacity-80 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: "var(--bg-card-hover)", color: "var(--text-secondary)" }}
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
