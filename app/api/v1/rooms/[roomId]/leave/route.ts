import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { emitToRoom } from "@/lib/socket-emitter";

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
    select: { id: true, status: true },
  });

  if (!room) {
    return NextResponse.json(
      { error: { code: "ROOM_NOT_FOUND", message: "部屋が存在しません" } },
      { status: 404 }
    );
  }

  const participant = await prisma.roomParticipant.findFirst({
    where: { roomId, userId, leftAt: null },
  });

  if (!participant) {
    return NextResponse.json(
      { error: { code: "NOT_IN_ROOM", message: "この部屋に参加していません" } },
      { status: 400 }
    );
  }

  const now = new Date();

  type LeaveResult =
    | { type: "host_changed"; newHostId: string; newHostUsername: string; systemMessageId: string; systemMessageContent: string; systemMessageCreatedAt: Date }
    | { type: "room_closed"; closedAt: Date }
    | { type: "normal" };

  const result = await prisma.$transaction(async (tx): Promise<LeaveResult> => {
    // 退室時刻を記録
    await tx.roomParticipant.update({
      where: { id: participant.id },
      data: { leftAt: now },
    });

    if (participant.isHost) {
      // ホスト退室: 最も早く参加した残余参加者へ引き継ぎ
      const nextHost = await tx.roomParticipant.findFirst({
        where: { roomId, leftAt: null, userId: { not: userId } },
        orderBy: { joinedAt: "asc" },
        select: { id: true, userId: true, user: { select: { username: true } } },
      });

      if (nextHost) {
        await tx.roomParticipant.update({
          where: { id: nextHost.id },
          data: { isHost: true },
        });
        await tx.room.update({
          where: { id: roomId },
          data: { hostId: nextHost.userId },
        });
        // ホスト変更のシステムメッセージ
        const systemMsg = await tx.chatMessage.create({
          data: {
            roomId,
            content: `${nextHost.user.username}さんがホストになりました`,
            isSystem: true,
          },
        });
        return {
          type: "host_changed",
          newHostId: nextHost.userId,
          newHostUsername: nextHost.user.username,
          systemMessageId: systemMsg.id,
          systemMessageContent: systemMsg.content,
          systemMessageCreatedAt: systemMsg.createdAt,
        };
      } else {
        // 残余参加者なし → 部屋を closed に
        const closedAt = now;
        await tx.room.update({
          where: { id: roomId },
          data: { status: "closed", closedAt },
        });
        return { type: "room_closed", closedAt };
      }
    }

    return { type: "normal" };
  });

  // Socket.IOサーバー（別プロセス）へイベントを送信
  if (result.type === "host_changed") {
    await emitToRoom("chat:message", roomId, {
      id: result.systemMessageId,
      roomId,
      user: null,
      content: result.systemMessageContent,
      isSystem: true,
      createdAt: result.systemMessageCreatedAt,
    });
    await emitToRoom("room:host_changed", roomId, {
      newHostId: result.newHostId,
      newHostUsername: result.newHostUsername,
    });
  } else if (result.type === "room_closed") {
    await emitToRoom("room:closed", roomId, {
      roomId,
      closedAt: result.closedAt,
    });
  }

  return new NextResponse(null, { status: 204 });
}
