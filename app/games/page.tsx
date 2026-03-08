import { getPopularGames } from "@/lib/games";
import { prisma } from "@/lib/prisma";
import { GamesGrid } from "./GamesGrid";

export default async function GamesPage() {
  const [games, rawCounts] = await Promise.all([
    getPopularGames(100),
    prisma.room.groupBy({
      by: ["gameId"],
      where: { status: "waiting" },
      _count: { id: true },
    }),
  ]);
  const roomCounts = Object.fromEntries(rawCounts.map((r) => [r.gameId, r._count.id]));

  return (
    <main className="mx-auto max-w-screen-xl px-4 py-10 pb-24 md:pb-10">
      {/* Page header */}
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          ゲームを選んで仲間を見つけよう
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          プレイしたいゲームを選択して、部屋を探そう
        </p>
      </div>

      <GamesGrid games={games} roomCounts={roomCounts} />
    </main>
  );
}
