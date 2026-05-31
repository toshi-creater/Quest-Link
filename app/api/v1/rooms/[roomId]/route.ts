import { NextResponse } from "next/server";
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
      guestSessionId: true,
      isHost: true,
      joinedAt: true,
      user: { select: { username: true, iconUrl: true, avgRating: true } },
    },
  },
} satisfies Prisma.RoomSelect;

type RawRoom = Prisma.RoomGetPayload<{ select: typeof roomSelect }>;

function formatRoom(room: RawRoom, guestMap: Map<string, string>) {
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
    host: room.host
      ? {
          id: room.host.id,
          username: room.host.username,
          iconUrl: room.host.iconUrl,
          avgRating: Number(room.host.avgRating),
        }
      : null,
    playStyleTags: room.playStyleTags.map((t) => t.tag),
    participants: room.participants.map((p) => ({
      userId: p.userId,
      guestSessionId: p.guestSessionId,
      username:
        p.user?.username ??
        (p.guestSessionId ? (guestMap.get(p.guestSessionId) ?? "ゲスト") : "ゲスト"),
      iconUrl: p.user?.iconUrl ?? null,
      avgRating:
        p.user?.avgRating !== null && p.user?.avgRating !== undefined
          ? Number(p.user.avgRating)
          : null,
      isHost: p.isHost,
      joinedAt: p.joinedAt,
    })),
  };
}

type RouteParams = { params: Promise<{ roomId: string }> };

export async function GET(request: Request, { params }: RouteParams) {
  const { roomId } = await params;

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: roomSelect,
  });

  if (!room) {
    return NextResponse.json(
      { error: { code: "ROOM_NOT_FOUND", message: "部屋が存在しません" } },
      { status: 404 }
    );
  }

  // ゲスト参加者の displayName を Guest テーブルから取得
  const guestSessionIds = room.participants
    .map((p) => p.guestSessionId)
    .filter((id): id is string => id !== null);
  const guestRecords =
    guestSessionIds.length > 0
      ? await prisma.guest.findMany({
          where: { guestSessionId: { in: guestSessionIds } },
          select: { guestSessionId: true, displayName: true },
        })
      : [];
  const guestMap = new Map(guestRecords.map((g) => [g.guestSessionId, g.displayName]));

  // リクエストの Cookie からゲストセッションを確認
  const cookieHeader = request.headers.get("cookie") ?? "";
  const guestSessionCookieMatch = cookieHeader.match(/quest_link_guest_session=([^;]+)/);
  const currentGuestSessionId = guestSessionCookieMatch?.[1] ?? null;
  const isCurrentGuestParticipant =
    currentGuestSessionId !== null &&
    guestSessionIds.includes(currentGuestSessionId);

  return NextResponse.json({
    data: {
      ...formatRoom(room, guestMap),
      isCurrentGuestParticipant,
      currentGuestSessionId: isCurrentGuestParticipant ? currentGuestSessionId : null,
    },
  });
}
