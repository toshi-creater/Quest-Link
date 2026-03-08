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
  game: { select: { id: true, name: true, coverUrl: true } },
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
      username: p.user.username,
      iconUrl: p.user.iconUrl,
      avgRating: p.user.avgRating !== null ? Number(p.user.avgRating) : null,
      isHost: p.isHost,
      joinedAt: p.joinedAt,
    })),
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "認証が必要です" } }, { status: 401 });
  }

  const participant = await prisma.roomParticipant.findFirst({
    where: {
      userId: session.user.id,
      leftAt: null,
      room: { status: { not: "closed" } },
    },
    select: {
      room: { select: roomSelect },
    },
  });

  if (!participant) {
    return NextResponse.json({ data: null });
  }

  return NextResponse.json({ data: formatRoom(participant.room) });
}
