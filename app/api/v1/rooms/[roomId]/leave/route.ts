import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

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

  await prisma.$transaction(async (tx) => {
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
        await tx.chatMessage.create({
          data: {
            roomId,
            content: `${nextHost.user.username}さんがホストになりました`,
            isSystem: true,
          },
        });
      } else {
        // 残余参加者なし → 部屋を closed に
        await tx.room.update({
          where: { id: roomId },
          data: { status: "closed", closedAt: now },
        });
      }
    }
  });

  return new NextResponse(null, { status: 204 });
}
