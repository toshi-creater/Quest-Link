import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Prisma } from "@prisma/client";

// ─── 共通セレクト ──────────────────────────────────────────────────────────────

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

function formatRoom(room: RawRoom) {
  const currentPlayers = room.participants.length;
  return {
    id: room.id,
    title: room.title,
    description: room.description,
    maxPlayers: room.maxPlayers,
    currentPlayers,
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

// ─── GET /api/v1/rooms ─────────────────────────────────────────────────────────

const listQuerySchema = z.object({
  status: z.enum(["waiting", "full", "closed"]).default("waiting"),
  gameId: z.string().uuid().optional(),
  tagSlugs: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "認証が必要です" } }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const parsed = listQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "クエリパラメータが不正です" } },
      { status: 400 }
    );
  }

  const { status, gameId, tagSlugs, page, limit } = parsed.data;
  const skip = (page - 1) * limit;

  const tagSlugList = tagSlugs ? tagSlugs.split(",").filter(Boolean) : [];

  const where: Prisma.RoomWhereInput = {
    status,
    ...(gameId && { gameId }),
    ...(tagSlugList.length > 0 && {
      playStyleTags: {
        some: { tag: { slug: { in: tagSlugList } } },
      },
    }),
  };

  const [rooms, total] = await Promise.all([
    prisma.room.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: roomSelect,
    }),
    prisma.room.count({ where }),
  ]);

  return NextResponse.json({
    data: rooms.map(formatRoom),
    meta: { total, page, limit },
  });
}

// ─── POST /api/v1/rooms ────────────────────────────────────────────────────────

const createSchema = z.object({
  title: z.string().min(1).max(100),
  gameId: z.string().uuid(),
  maxPlayers: z.number().int().min(2).max(16),
  description: z.string().optional(),
  playStyleTagIds: z.array(z.string().uuid()).optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "認証が必要です" } }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "リクエストが不正です", details: parsed.error.flatten() } },
      { status: 400 }
    );
  }

  const { title, gameId, maxPlayers, description, playStyleTagIds } = parsed.data;

  // ゲーム存在確認
  const game = await prisma.game.findUnique({ where: { id: gameId } });
  if (!game) {
    return NextResponse.json({ error: { code: "INVALID_GAME", message: "指定したゲームが存在しません" } }, { status: 400 });
  }

  // タグ検証
  if (playStyleTagIds && playStyleTagIds.length > 0) {
    const validTags = await prisma.playStyleTag.findMany({
      where: { id: { in: playStyleTagIds }, isActive: true },
      select: { id: true },
    });
    if (validTags.length !== playStyleTagIds.length) {
      return NextResponse.json({ error: { code: "INVALID_TAG", message: "無効なタグIDが指定されました" } }, { status: 400 });
    }
  }

  const userId = session.user.id;

  const room = await prisma.$transaction(async (tx) => {
    const newRoom = await tx.room.create({
      data: {
        title,
        gameId,
        maxPlayers,
        description,
        hostId: userId,
        inviteToken: randomBytes(32).toString("hex"),
        ...(playStyleTagIds && playStyleTagIds.length > 0 && {
          playStyleTags: {
            createMany: { data: playStyleTagIds.map((tagId) => ({ tagId })) },
          },
        }),
      },
      select: { id: true },
    });

    // ホストを参加者として追加
    await tx.roomParticipant.create({
      data: { roomId: newRoom.id, userId, isHost: true },
    });

    return tx.room.findUniqueOrThrow({
      where: { id: newRoom.id },
      select: roomSelect,
    });
  });

  return NextResponse.json({ data: formatRoom(room) }, { status: 201 });
}
