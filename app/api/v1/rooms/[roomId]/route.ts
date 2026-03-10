import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

const roomSelect = {
  id: true,
  title: true,
  description: true,
  maxPlayers: true,
  status: true,
  createdAt: true,
  closedAt: true,
  game: { select: { id: true, igdbId: true, name: true, coverImageUrl: true } },
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

function formatRoom(room: RawRoom) {
  return {
    id: room.id,
    title: room.title,
    description: room.description,
    maxPlayers: room.maxPlayers,
    currentPlayers: room.participants.length,
    status: room.status,
    createdAt: room.createdAt,
    closedAt: room.closedAt,
    game: room.game,
    host: {
      id: room.host.id,
      username: room.host.username,
      iconUrl: room.host.iconUrl,
      avgRating: Number(room.host.avgRating),
    },
    playStyleTags: room.playStyleTags.map((t) => t.tag),
    participants: room.participants.map((p) => ({
      userId: p.userId,
      username: p.user?.username ?? "",
      iconUrl: p.user?.iconUrl ?? null,
      avgRating: p.user?.avgRating !== null && p.user?.avgRating !== undefined ? Number(p.user.avgRating) : null,
      isHost: p.isHost,
      joinedAt: p.joinedAt,
    })),
  };
}

type RouteParams = { params: Promise<{ roomId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "認証が必要です" } }, { status: 401 });
  }

  const { roomId } = await params;

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: roomSelect,
  });

  if (!room) {
    return NextResponse.json({ error: { code: "ROOM_NOT_FOUND", message: "部屋が存在しません" } }, { status: 404 });
  }

  return NextResponse.json({ data: formatRoom(room) });
}
