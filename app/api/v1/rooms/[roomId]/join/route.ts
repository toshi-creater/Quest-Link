import { after } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { emitToRoom } from "@/lib/socket-emitter";

type RouteParams = { params: Promise<{ roomId: string }> };

type CteRow = {
  max_players: bigint;
  cnt: bigint;
  ins_id: string | null;
  ins_joined_at: Date | null;
  already_joined: boolean;
};

export async function POST(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
      { status: 401 }
    );
  }

  const { roomId } = await params;
  const userId = session.user.id;

  const [room, hostRoom, user] = await Promise.all([
    prisma.room.findUnique({
      where: { id: roomId },
      select: { id: true, status: true, maxPlayers: true },
    }),
    prisma.room.findFirst({
      where: { hostId: userId, status: { not: "closed" }, id: { not: roomId } },
      select: { id: true },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, iconUrl: true, avgRating: true },
    }),
  ]);

  if (!room) {
    return NextResponse.json(
      { error: { code: "ROOM_NOT_FOUND", message: "部屋が存在しません" } },
      { status: 404 }
    );
  }

  if (room.status === "closed") {
    return NextResponse.json(
      { error: { code: "ROOM_CLOSED", message: "この部屋は解散済みです" } },
      { status: 400 }
    );
  }

  if (hostRoom) {
    return NextResponse.json(
      { error: { code: "HOST_CANNOT_JOIN", message: "ホストは他の部屋に参加できません" } },
      { status: 409 }
    );
  }

  // DB ラウンドトリップを 1RTT に削減のため、$transaction（5RTT）を単一 CTE に置き換え。
  let rows: CteRow[];
  try {
    rows = await prisma.$queryRaw<CteRow[]>`
      WITH
        lock AS (
          SELECT id, max_players FROM rooms WHERE id = ${roomId}::uuid FOR UPDATE
        ),
        active AS (
          SELECT COUNT(*) AS cnt FROM room_participants
          WHERE room_id = ${roomId}::uuid AND left_at IS NULL
        ),
        ins AS (
          INSERT INTO room_participants (id, room_id, user_id, is_host, joined_at)
          SELECT gen_random_uuid(), ${roomId}::uuid, ${userId}::uuid, false, NOW()
          WHERE (SELECT cnt FROM active) < (SELECT max_players FROM lock)
          RETURNING id, joined_at
        ),
        upd AS (
          UPDATE rooms SET status = 'full'
          WHERE id = ${roomId}::uuid
            AND (SELECT cnt FROM active) + 1 >= (SELECT max_players FROM lock)
            AND EXISTS (SELECT 1 FROM ins)
        )
      SELECT
        (SELECT max_players FROM lock)  AS max_players,
        (SELECT cnt FROM active)        AS cnt,
        (SELECT id FROM ins)            AS ins_id,
        (SELECT joined_at FROM ins)     AS ins_joined_at
    `;
  } catch (error: unknown) {
    // 一意部分インデックス違反 → 既に参加中
    // Prisma 7.x + PrismaPg adapter では pg エラーコードが
    // meta.driverAdapterError.cause.originalCode に格納される
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code: string }).code === "P2010"
    ) {
      const meta = (error as {
        meta?: {
          code?: string;
          message?: string;
          driverAdapterError?: { cause?: { originalCode?: string } };
        };
      }).meta;
      const pgCode =
        meta?.code ?? meta?.driverAdapterError?.cause?.originalCode ?? "";
      if (pgCode === "23505") {
        return NextResponse.json(
          { error: { code: "ALREADY_JOINED", message: "既にこの部屋に参加しています" } },
          { status: 409 }
        );
      }
    }
    throw error;
  }

  const row = rows[0];

  if (!row?.ins_id) {
    return NextResponse.json(
      { error: { code: "ROOM_FULL", message: "この部屋は満員です" } },
      { status: 409 }
    );
  }

  const joinedAt = row.ins_joined_at!;

  const response = NextResponse.json({
    data: {
      roomId,
      userId,
      isHost: false,
      joinedAt,
    },
  });

  after(async () => {
    const systemMsg = await prisma.chatMessage.create({
      data: {
        roomId,
        content: `${user?.username ?? "ユーザー"}さんが入室しました`,
        isSystem: true,
      },
    });

    await emitToRoom("chat:message", roomId, {
      id: systemMsg.id,
      roomId,
      user: null,
      content: systemMsg.content,
      isSystem: true,
      createdAt: systemMsg.createdAt,
    });

    await emitToRoom("room:user_joined", roomId, {
      userId,
      username: user?.username ?? "",
      iconUrl: user?.iconUrl ?? null,
      avgRating: Number(user?.avgRating ?? 0),
      joinedAt,
    });
  });

  return response;
}
