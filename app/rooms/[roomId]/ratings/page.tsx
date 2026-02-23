import Link from "next/link";
import { Clock, CheckCircle2 } from "lucide-react";
import { PENDING_RATING_USERS } from "@/lib/mock-data";
import { RatingForm } from "./RatingForm";

type Props = {
  params: Promise<{ roomId: string }>;
};

export default async function RatingsPage({ params }: Props) {
  const { roomId } = await params;
  const expiresAt = new Date("2026-02-23T22:00:00Z");
  const now = new Date("2026-02-22T22:30:00Z");
  const hoursLeft = Math.floor((expiresAt.getTime() - now.getTime()) / 1000 / 60 / 60);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div
        className="mb-6 rounded-2xl border p-6 text-center"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <div
          className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full"
          style={{ backgroundColor: "rgba(34,197,94,0.15)" }}
        >
          <CheckCircle2 className="h-7 w-7 text-green-400" />
        </div>
        <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
          セッション終了
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          一緒にプレイした仲間を評価しましょう（任意）
        </p>
        <div
          className="mt-3 flex items-center justify-center gap-1.5 text-xs"
          style={{ color: hoursLeft <= 6 ? "#f97316" : "var(--text-muted)" }}
        >
          <Clock className="h-3.5 w-3.5" />
          評価期限: 残り{hoursLeft}時間
        </div>
      </div>

      {/* Rating cards */}
      <div className="space-y-4">
        {PENDING_RATING_USERS.map((user) => (
          <RatingForm key={user.userId} user={user} roomId={roomId} />
        ))}
      </div>

      {/* Skip */}
      <div className="mt-6 text-center">
        <Link
          href="/rooms"
          className="text-sm transition-colors hover:text-white"
          style={{ color: "var(--text-secondary)" }}
        >
          スキップして部屋一覧へ →
        </Link>
      </div>
    </div>
  );
}
