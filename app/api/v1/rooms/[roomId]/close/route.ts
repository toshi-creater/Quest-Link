import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { emitToRoom } from "@/lib/socket-emitter";

type RouteParams = { params: Promise<{ roomId: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "認証が必要です" } }, { status: 401 });
  }

  const { roomId } = await params;

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { id: true, hostId: true, status: true },
  });

  if (!room) {
    return NextResponse.json({ error: { code: "ROOM_NOT_FOUND", message: "部屋が存在しません" } }, { status: 404 });
  }

  if (room.hostId !== session.user.id) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "ホストのみ解散できます" } }, { status: 403 });
  }

  if (room.status === "closed") {
    return NextResponse.json({ error: { code: "ROOM_ALREADY_CLOSED", message: "既に解散済みです" } }, { status: 400 });
  }

  const closedAt = new Date();

  await prisma.$transaction(async (tx) => {
    // 全参加者を退室状態に
    await tx.roomParticipant.updateMany({
      where: { roomId, leftAt: null },
      data: { leftAt: closedAt },
    });
    // 部屋を closed に
    await tx.room.update({
      where: { id: roomId },
      data: { status: "closed", closedAt },
    });
  });

  // Socket.IOサーバー（別プロセス）へ解散通知を送信
  await emitToRoom("room:closed", roomId, { roomId, closedAt });

  return new NextResponse(null, { status: 204 });
}
