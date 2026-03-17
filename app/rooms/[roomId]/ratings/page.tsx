import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Clock, CheckCircle2 } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RatingForm } from "./RatingForm";

type Props = {
  params: Promise<{ roomId: string }>;
};

export default async function RatingsPage({ params }: Props) {
  const { roomId } = await params;

  const session = await auth();
  const currentUserId = session?.user?.id;
  if (!currentUserId) redirect("/login");

  const [room, myParticipant, participants, submittedRatings] = await Promise.all([
    prisma.room.findUnique({ where: { id: roomId }, select: { closedAt: true } }),
    prisma.roomParticipant.findFirst({
      where: { roomId, userId: currentUserId },
      select: { leftAt: true },
    }),
    prisma.roomParticipant.findMany({
      where: { roomId, userId: { not: currentUserId } },
      select: {
        userId: true,
        user: { select: { username: true, iconUrl: true, avgRating: true } },
      },
    }),
    prisma.rating.findMany({
      where: { roomId, reviewerId: currentUserId },
      select: { revieweeId: true },
    }),
  ]);
  if (!room) notFound();

  const ratedIds = new Set(submittedRatings.map((r) => r.revieweeId));
  const now = new Date();
  const baseTime = myParticipant?.leftAt ?? room.closedAt;
  const expiresAt = baseTime
    ? new Date(baseTime.getTime() + 24 * 60 * 60 * 1000)
    : new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const pendingUsers = participants
    .filter((p) => p.userId && p.user && !ratedIds.has(p.userId))
    .map((p) => ({
      userId: p.userId!,
      username: p.user!.username,
      iconUrl: p.user!.iconUrl,
      avgRating: p.user!.avgRating !== null ? Number(p.user!.avgRating) : null,
      expiresAt: expiresAt.toISOString(),
    }));

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
        {pendingUsers.map((user) => (
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
