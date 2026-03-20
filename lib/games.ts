import { prisma } from "@/lib/prisma";

export type GameResult = { id: string; name: string; coverImageUrl: string | null };

export async function searchGames(query: string, limit = 10): Promise<GameResult[]> {
  return prisma.game.findMany({
    where: { name: { contains: query, mode: "insensitive" }, isActive: true },
    orderBy: { displayOrder: "asc" },
    take: limit,
    select: { id: true, name: true, coverImageUrl: true },
  });
}

export async function getPopularGames(limit = 10): Promise<GameResult[]> {
  "use cache";
  return prisma.game.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: "asc" },
    take: limit,
    select: { id: true, name: true, coverImageUrl: true },
  });
}

export async function getGameById(id: string): Promise<GameResult | null> {
  "use cache";
  return prisma.game.findUnique({
    where: { id },
    select: { id: true, name: true, coverImageUrl: true },
  });
}
