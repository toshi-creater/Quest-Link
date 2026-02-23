"use client";

import { useState } from "react";
import { CheckCircle2 } from "lucide-react";
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function RatingForm({ user, roomId: _roomId }: Props) {
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (!score) return;
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div
        className="flex items-center gap-4 rounded-2xl border p-5 opacity-60"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <UserAvatar username={user.username} iconUrl={user.iconUrl} size="md" />
        <div className="flex-1">
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
            {user.username}
          </p>
          <p className="text-xs text-green-400">評価を送信しました</p>
        </div>
        <CheckCircle2 className="h-5 w-5 text-green-400" />
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
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
          className="w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none focus:border-purple-500 transition-colors"
          style={{
            backgroundColor: "var(--bg-input)",
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={!score}
        className={clsx(
          "w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all",
          score ? "hover:opacity-90" : "opacity-40 cursor-not-allowed"
        )}
        style={{
          background: score
            ? "linear-gradient(135deg, var(--accent), #6d28d9)"
            : "var(--border)",
        }}
      >
        評価を送信
      </button>
    </div>
  );
}
