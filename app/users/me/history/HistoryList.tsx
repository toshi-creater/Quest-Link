import { Calendar } from "@phosphor-icons/react/dist/ssr";
import { prisma } from "@/lib/prisma";
import { GameCover } from "@/components/ui/GamePicker";

type Props = { userId: string };

export async function HistoryList({ userId }: Props) {
  const participations = await prisma.roomParticipant.findMany({
    where: { userId },
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
            select: { id: true, igdbId: true, name: true, coverImageUrl: true },
          },
        },
      },
    },
  });

  if (participations.length === 0) {
    return (
      <div
        className="rounded-2xl px-4 py-10 sm:px-6 sm:py-16 text-center"
        style={{ backgroundColor: "var(--bg-card)" }}
      >
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          まだ参加した部屋がありません
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "var(--bg-card)" }}
    >
      <ul>
        {participations.map((p, idx) => {
          const joinedDate = p.joinedAt;
          const endDate = p.leftAt ?? p.room.closedAt;
          const durationMinutes = endDate
            ? Math.floor((endDate.getTime() - joinedDate.getTime()) / 1000 / 60)
            : null;

          return (
            <li
              key={`${p.room.id}-${idx}`}
              className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4"
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
                <div
                  className="flex items-center gap-1 text-xs"
                  style={{ color: "var(--text-secondary)" }}
                >
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
                }}
              >
                終了
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
