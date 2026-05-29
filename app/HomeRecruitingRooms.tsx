import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { RoomCard } from "@/components/ui/RoomCard";
import { type RoomSummary } from "@/lib/api/rooms";

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
    select: {
      tag: {
        select: {
          id: true,
          name: true,
          slug: true,
          category: { select: { id: true, name: true, slug: true } },
        },
      },
    },
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
  return {
    id: room.id,
    title: room.title,
    description: room.description,
    maxPlayers: room.maxPlayers,
    currentPlayers: room.participants.length,
    status: room.status as "waiting" | "playing" | "closed",
    createdAt: room.createdAt.toISOString(),
    game: room.game,
    host: room.host
      ? {
          id: room.host.id,
          username: room.host.username,
          iconUrl: room.host.iconUrl,
          avgRating: Number(room.host.avgRating),
        }
      : null,
    playStyleTags: room.playStyleTags.map((t) => t.tag),
  };
}

export async function HomeRecruitingRooms() {
  const session = await auth();
  const userId = session?.user?.id ?? null;

  let rooms: RoomSummary[];

  if (!userId) {
    const rawRooms = await prisma.room.findMany({
      where: { status: "waiting" },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: roomSelect,
    });
    rooms = rawRooms.map(formatRoom);
  } else {
    const userGameIds = (
      await prisma.userGame.findMany({
        where: { userId },
        select: { gameId: true },
      })
    ).map((r) => r.gameId);

    const [userRawRooms, fillRawRooms] = await Promise.all([
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

    const userRoomIds = new Set(userRawRooms.map((r) => r.id));
    rooms = [
      ...userRawRooms,
      ...fillRawRooms.filter((r) => !userRoomIds.has(r.id)),
    ]
      .slice(0, 6)
      .map(formatRoom);
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {rooms.map((room) => (
        <RoomCard key={room.id} room={room} />
      ))}
    </div>
  );
}
