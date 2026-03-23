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
    <main className="mx-auto max-w-screen-xl px-4 md:py-10 py-5 pb-24 md:pb-10">
      {/* Page header */}
      <div className="mb-4 sm:mb-8 md:text-left text-center">
        <h1 className="text-lg sm:text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          ゲームを選択
        </h1>
      </div>

      <GamesGrid games={games} roomCounts={roomCounts} />
    </main>
  );
}
