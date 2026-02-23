import Link from "next/link";
import { ArrowLeft, Calendar } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { GameCover } from "@/components/ui/GamePicker";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const participations = await prisma.roomParticipant.findMany({
    where: { userId: session.user.id },
    orderBy: { joinedAt: "desc" },
    take: 50,
    select: {
      joinedAt: true,
      leftAt: true,
      room: {
        select: {
          id: true,
          title: true,
          closedAt: true,
          game: {
            select: { id: true, igdbId: true, name: true, coverUrl: true },
          },
        },
      },
    },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/users/me"
        className="mb-6 flex items-center gap-2 text-sm transition-colors hover:text-white"
        style={{ color: "var(--text-secondary)" }}
      >
        <ArrowLeft className="h-4 w-4" />
        プロフィールに戻る
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          参加履歴
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          過去に参加した部屋の一覧
        </p>
      </div>

      {participations.length === 0 ? (
        <div
          className="rounded-2xl border px-6 py-16 text-center"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            まだ参加した部屋がありません
          </p>
        </div>
      ) : (
        <div
          className="rounded-2xl border overflow-hidden"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
            {participations.map((p, idx) => {
              const joinedDate = p.joinedAt;
              const endDate = p.leftAt ?? p.room.closedAt;
              const durationMinutes = endDate
                ? Math.floor(
                    (endDate.getTime() - joinedDate.getTime()) / 1000 / 60
                  )
                : null;

              return (
                <li
                  key={`${p.room.id}-${idx}`}
                  className="flex items-center gap-4 px-5 py-4"
                  style={{ borderColor: "var(--border)" }}
                >
                  <GameCover game={p.room.game} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium" style={{ color: "var(--accent-light)" }}>
                      {p.room.game.name}
                    </p>
                    <p className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {p.room.title}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="flex items-center gap-1 text-xs" style={{ color: "var(--text-secondary)" }}>
                      <Calendar className="h-3 w-3" />
                      {joinedDate.toLocaleDateString("ja-JP", {
                        month: "numeric",
                        day: "numeric",
                      })}
                    </div>
                    {durationMinutes !== null && (
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        {durationMinutes}分間
                      </p>
                    )}
                  </div>
                  <span
                    className="shrink-0 rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: "rgba(100,100,120,0.15)",
                      color: "var(--text-muted)",
                      border: "1px solid rgba(100,100,120,0.3)",
                    }}
                  >
                    終了
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
