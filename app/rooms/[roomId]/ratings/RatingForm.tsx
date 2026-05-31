"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle } from "@phosphor-icons/react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { StarRating, RatingDisplay } from "@/components/ui/StarRating";
import clsx from "clsx";

type User = {
  userId: string;
  username: string;
  iconUrl: string | null;
  avgRating: number | null;
  expiresAt: string;
};

type Props = {
  user: User;
  roomId: string;
};

type RatingPayload = {
  revieweeId: string;
  score: number;
  comment?: string;
};

async function postRating(roomId: string, payload: RatingPayload) {
  const res = await fetch(`/api/v1/rooms/${roomId}/ratings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body as { error?: { message?: string } }).error?.message ?? "評価の送信に失敗しました"
    );
  }
  return res.json();
}

export function RatingForm({ user, roomId }: Props) {
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");

  const mutation = useMutation({
    mutationFn: (payload: RatingPayload) => postRating(roomId, payload),
  });

  const handleSubmit = () => {
    if (!score) return;
    mutation.mutate({
      revieweeId: user.userId,
      score,
      comment: comment || undefined,
    });
  };

  if (mutation.isSuccess) {
    return (
      <div
        className="flex items-center gap-4 rounded-2xl p-5 opacity-60 animate-scale-in"
        style={{ backgroundColor: "var(--bg-card)" }}
      >
        <UserAvatar username={user.username} iconUrl={user.iconUrl} size="md" />
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {user.username}
          </p>
          <p className="text-xs" style={{ color: "#22c55e" }}>評価を送信しました</p>
        </div>
        <CheckCircle className="h-5 w-5 animate-scale-in" style={{ color: "#22c55e", animationDelay: "150ms" }} />
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-5"
      style={{ backgroundColor: "var(--bg-card)" }}
    >
      <div className="flex items-center gap-3 mb-4">
        <UserAvatar username={user.username} iconUrl={user.iconUrl} size="md" />
        <div>
          <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
            {user.username}
          </p>
          <RatingDisplay
            avgRating={user.avgRating}
            ratingCount={user.avgRating != null ? 10 : 3}
            size="sm"
          />
        </div>
      </div>

      {/* Star input */}
      <div className="mb-3">
        <p className="mb-2 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          評価スコア
        </p>
        <StarRating value={score} onChange={setScore} size="lg" />
      </div>

      {/* Comment */}
      <div className="mb-4">
        <p className="mb-1.5 text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
          コメント{" "}
          <span style={{ color: "var(--text-muted)" }}>（任意）</span>
        </p>
        <textarea
          rows={2}
          placeholder="一言コメントを残しましょう..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={500}
          className="w-full resize-none rounded-xl px-3 py-2 text-sm outline-none"
          style={{
            backgroundColor: "var(--bg-input)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      {mutation.isError && (
        <p className="mb-3 text-xs text-red-400 animate-slide-in-bottom">
          {mutation.error instanceof Error ? mutation.error.message : "評価の送信に失敗しました"}
        </p>
      )}

      <button
        onClick={handleSubmit}
        disabled={!score || mutation.isPending}
        className={clsx(
          "w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all",
          score && !mutation.isPending ? "hover:opacity-90 active:scale-[0.97]" : "opacity-40 cursor-not-allowed"
        )}
        style={{
          background:
            score && !mutation.isPending
              ? "linear-gradient(135deg, var(--accent), #6d28d9)"
              : "var(--border)",
        }}
      >
        {mutation.isPending ? "送信中..." : "評価を送信"}
      </button>
    </div>
  );
}
