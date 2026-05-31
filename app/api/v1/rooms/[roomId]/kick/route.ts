import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { emitToRoom } from "@/lib/socket-emitter";
import { Prisma } from "@prisma/client";

type RouteParams = { params: Promise<{ roomId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
      { status: 401 }
    );
  }

  const { roomId } = await params;
  const hostId = session.user.id;

  const body = (await request.json()) as { userId?: string; guestSessionId?: string };
  const { userId: targetUserId, guestSessionId: targetGuestSessionId } = body;

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { id: true, hostId: true, status: true, maxPlayers: true },
  });

  if (!room) {
    return NextResponse.json(
      { error: { code: "ROOM_NOT_FOUND", message: "部屋が存在しません" } },
      { status: 404 }
    );
  }

  if (room.hostId !== hostId) {
    return NextResponse.json(
      { error: { code: "FORBIDDEN", message: "ホストのみキックできます" } },
      { status: 403 }
    );
  }

  if (room.status === "closed") {
    return NextResponse.json(
      { error: { code: "ROOM_CLOSED", message: "部屋がすでに閉じています" } },
      { status: 400 }
    );
  }

  if (targetUserId && targetUserId === hostId) {
    return NextResponse.json(
      { error: { code: "CANNOT_KICK_SELF", message: "自分自身をキックできません" } },
      { status: 400 }
    );
  }

  if (!targetUserId && !targetGuestSessionId) {
    return NextResponse.json(
      { error: { code: "PARTICIPANT_NOT_FOUND", message: "対象が参加中でない" } },
      { status: 404 }
    );
  }

  const targetParticipant = await prisma.roomParticipant.findFirst({
    where: {
      roomId,
      leftAt: null,
      ...(targetUserId ? { userId: targetUserId } : { guestSessionId: targetGuestSessionId }),
    },
  });

  if (!targetParticipant) {
    return NextResponse.json(
      { error: { code: "PARTICIPANT_NOT_FOUND", message: "対象が参加中でない" } },
      { status: 404 }
    );
  }

  if (targetParticipant.isHost) {
    return NextResponse.json(
      { error: { code: "CANNOT_KICK_HOST", message: "ホストをキックできません" } },
      { status: 400 }
    );
  }

  let targetUsername: string;
  if (targetUserId) {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { username: true },
    });
    targetUsername = user?.username ?? "ユーザー";
  } else {
    const guest = await prisma.guest.findUnique({
      where: { guestSessionId: targetGuestSessionId! },
      select: { displayName: true },
    });
    targetUsername = guest?.displayName ?? "ゲスト";
  }

  const kickedAt = new Date();

  const currentCount = await prisma.roomParticipant.count({
    where: { roomId, leftAt: null },
  });
  const shouldUpdateToWaiting = room.status === "full" && currentCount - 1 < room.maxPlayers;

  const kickMsg = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.roomParticipant.update({
      where: { id: targetParticipant.id },
      data: { leftAt: kickedAt },
    });

    if (shouldUpdateToWaiting) {
      await tx.room.update({
        where: { id: roomId },
        data: { status: "waiting" },
      });
    }

    return tx.chatMessage.create({
      data: {
        roomId,
        content: `${targetUsername}さんが退室しました`,
        isSystem: true,
      },
    });
  });

  await emitToRoom("chat:message", roomId, {
    id: kickMsg.id,
    roomId,
    user: null,
    content: kickMsg.content,
    isSystem: true,
    createdAt: kickMsg.createdAt,
  });
  await emitToRoom("room:user_kicked", roomId, {
    kickedUserId: targetUserId ?? null,
    kickedGuestSessionId: targetGuestSessionId ?? null,
    byHostId: hostId,
    kickedAt,
  });

  return new NextResponse(null, { status: 204 });
}
