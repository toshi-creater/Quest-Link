import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { Prisma } from "@prisma/client";
import { connection } from "next/server";
import { auth } from "@/auth";
import { getPopularGames, getPopularGamesExcluding, type GameResult } from "@/lib/games";
import { prisma } from "@/lib/prisma";
import { RoomCard } from "@/components/ui/RoomCard";
import { type RoomSummary } from "@/lib/api/rooms";
import { HomeGameGrid } from "./HomeGameGrid";

const roomSelect = {
  id: true,
  title: true,
  description: true,
  maxPlayers: true,
  status: true,
  createdAt: true,
  closedAt: true,
  game: { select: { id: true, name: true, coverImageUrl: true } },
  host: { select: { id: true, username: true, iconUrl: true, avgRating: true } },
  playStyleTags: {
    select: { tag: { select: { id: true, name: true, slug: true } } },
  },
  participants: {
    where: { leftAt: null },
    select: {
      userId: true,
      isHost: true,
      joinedAt: true,
      user: { select: { username: true, iconUrl: true, avgRating: true } },
    },
  },
} satisfies Prisma.RoomSelect;

type RawRoom = Prisma.RoomGetPayload<{ select: typeof roomSelect }>;

function formatRoom(room: RawRoom): RoomSummary {
  const currentPlayers = room.participants.length;
  return {
    id: room.id,
    title: room.title,
    description: room.description,
    maxPlayers: room.maxPlayers,
    currentPlayers,
    status: room.status as "waiting" | "playing" | "closed",
    createdAt: room.createdAt.toISOString(),
    game: room.game,
    host: {
      id: room.host.id,
      username: room.host.username,
      iconUrl: room.host.iconUrl,
      avgRating: Number(room.host.avgRating),
    },
    playStyleTags: room.playStyleTags.map((t) => t.tag),
  };
}

export default async function HomePage() {
  await connection();

  const session = await auth();
  const userId = session?.user?.id ?? null;

  let games: GameResult[];
  let rooms: RoomSummary[];

  if (!userId) {
    const [popularGames, rawRooms] = await Promise.all([
      getPopularGames(6),
      prisma.room.findMany({
        where: { status: "waiting" },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: roomSelect,
      }),
    ]);
    games = popularGames;
    rooms = rawRooms.map(formatRoom);
  } else {
    const userGameRows = await prisma.userGame.findMany({
      where: { userId },
      select: { game: { select: { id: true, name: true, coverImageUrl: true } } },
    });
    const userGames = userGameRows.map((r) => r.game);
    const userGameIds = userGames.map((g) => g.id);
    const userGamesSlice = userGames.slice(0, 6);
    const fillGamesCount = 6 - userGamesSlice.length;

    const [fillGames, userRawRooms, fillRawRooms] = await Promise.all([
      fillGamesCount > 0
        ? getPopularGamesExcluding(userGameIds, fillGamesCount)
        : Promise.resolve([] as GameResult[]),
      prisma.room.findMany({
        where: { status: "waiting", gameId: { in: userGameIds } },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: roomSelect,
      }),
      prisma.room.findMany({
        where: {
          status: "waiting",
          ...(userGameIds.length > 0 ? { gameId: { notIn: userGameIds } } : {}),
        },
        orderBy: { createdAt: "desc" },
        take: 6,
        select: roomSelect,
      }),
    ]);

    games = [...userGamesSlice, ...fillGames];

    const userRoomIds = new Set(userRawRooms.map((r) => r.id));
    const mergedRawRooms = [
      ...userRawRooms,
      ...fillRawRooms.filter((r) => !userRoomIds.has(r.id)),
    ].slice(0, 6);
    rooms = mergedRawRooms.map(formatRoom);
  }

  return (
    <main className="mx-auto max-w-screen-xl px-4 py-10 pb-24 md:pb-10 space-y-12">
      {/* ── おすすめゲーム ── */}
      <section className="animate-fade-in-up">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            おすすめゲーム
          </h2>
          <Link
            href="/games"
            className="flex items-center gap-1 text-sm transition-colors hover:text-white"
            style={{ color: "var(--accent-light)" }}
          >
            すべて見る
            <CaretRight className="h-4 w-4" />
          </Link>
        </div>

        <HomeGameGrid games={games} />
      </section>

      {/* ── 募集中の部屋 ── */}
      <section className="animate-fade-in-up" style={{ animationDelay: "100ms" }}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            募集中の部屋
          </h2>
          <Link
            href="/rooms"
            className="flex items-center gap-1 text-sm transition-colors hover:text-white"
            style={{ color: "var(--accent-light)" }}
          >
            もっと見る
            <CaretRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </section>
    </main>
  );
}
