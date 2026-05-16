import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { emitToRoom } from "@/lib/socket-emitter";
import { Prisma } from "@prisma/client";

type RouteParams = { params: Promise<{ roomId: string }> };

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

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { id: true, status: true, maxPlayers: true },
  });

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

  const hostRoom = await prisma.room.findFirst({ where: { hostId: userId, status: { not: "closed" } } });
  if (hostRoom && hostRoom.id !== roomId) {
    return NextResponse.json(
      { error: { code: "HOST_CANNOT_JOIN", message: "ホストは他の部屋に参加できません" } },
      { status: 409 }
    );
  }

  try {
    const participant = await prisma.$transaction(
      async (tx) => {
        // SELECT FOR UPDATE でロックを取得し競合状態を防ぐ
        await tx.$queryRaw`SELECT id FROM rooms WHERE id = ${roomId}::uuid FOR UPDATE`;

        const [currentCount, existing] = await Promise.all([
          tx.roomParticipant.count({ where: { roomId, leftAt: null } }),
          tx.roomParticipant.findFirst({ where: { roomId, userId, leftAt: null } }),
        ]);

        if (existing) {
          throw new Error("ALREADY_JOINED");
        }

        if (currentCount >= room.maxPlayers) {
          throw new Error("ROOM_FULL");
        }

        const newParticipant = await tx.roomParticipant.create({
          data: { roomId, userId, isHost: false },
        });

        // 満員到達時に status を full へ自動遷移
        if (currentCount + 1 >= room.maxPlayers) {
          await tx.room.update({
            where: { id: roomId },
            data: { status: "full" },
          });
        }

        return newParticipant;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }
    );

    // 入室システムメッセージとイベント通知
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { username: true, iconUrl: true, avgRating: true },
    });

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
      joinedAt: participant.joinedAt,
    });

    return NextResponse.json({
      data: {
        roomId: participant.roomId,
        userId: participant.userId,
        isHost: participant.isHost,
        joinedAt: participant.joinedAt,
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "ALREADY_JOINED") {
        return NextResponse.json(
          { error: { code: "ALREADY_JOINED", message: "既にこの部屋に参加しています" } },
          { status: 409 }
        );
      }
      if (error.message === "ROOM_FULL") {
        return NextResponse.json(
          { error: { code: "ROOM_FULL", message: "この部屋は満員です" } },
          { status: 409 }
        );
      }
    }
    throw error;
  }
}
