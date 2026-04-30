import { connection } from "next/server";
import { getPopularGames } from "@/lib/games";
import { prisma } from "@/lib/prisma";
import { GamesGrid } from "./GamesGrid";

export async function GamesGridServer() {
  await connection();
  const [games, rawCounts] = await Promise.all([
    getPopularGames(100),
    prisma.room.groupBy({
      by: ["gameId"],
      where: { status: "waiting" },
      _count: { id: true },
    }),
  ]);
  const roomCounts = Object.fromEntries(rawCounts.map((r) => [r.gameId, r._count.id]));

  return <GamesGrid games={games} roomCounts={roomCounts} />;
}
