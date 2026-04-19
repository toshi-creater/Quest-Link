import { auth } from "@/auth";
import { getPopularGames, getPopularGamesExcluding } from "@/lib/games";
import { prisma } from "@/lib/prisma";
import { HomeGameGrid } from "./HomeGameGrid";

export async function HomeRecommendedGames() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  if (!userId) {
    const games = await getPopularGames(6);
    return <HomeGameGrid games={games} />;
  }

  const userGameRows = await prisma.userGame.findMany({
    where: { userId },
    select: { game: { select: { id: true, name: true, coverImageUrl: true } } },
  });
  const userGames = userGameRows.map((r) => r.game);
  const userGameIds = userGames.map((g) => g.id);
  const userGamesSlice = userGames.slice(0, 6);
  const fillGamesCount = 6 - userGamesSlice.length;

  const fillGames =
    fillGamesCount > 0 ? await getPopularGamesExcluding(userGameIds, fillGamesCount) : [];

  return <HomeGameGrid games={[...userGamesSlice, ...fillGames]} />;
}
