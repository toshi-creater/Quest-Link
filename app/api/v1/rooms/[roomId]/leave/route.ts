import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { emitToRoom } from "@/lib/socket-emitter";
import { leaveRoomInTx, emitLeaveRoomEvents } from "@/lib/leave-room";

type RouteParams = { params: Promise<{ roomId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();
  const { roomId } = await params;

  // ゲスト退室
  if (!session?.user?.id) {
    const cookieHeader = request.headers.get("cookie") ?? "";
    const match = cookieHeader.match(/quest_link_guest_session=([^;]+)/);
    const guestSessionId = match?.[1] ?? null;
    if (!guestSessionId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
        { status: 401 }
      );
    }

    const guestParticipant = await prisma.roomParticipant.findFirst({
      where: { roomId, guestSessionId, leftAt: null },
    });
    if (!guestParticipant) {
      return NextResponse.json(
        { error: { code: "NOT_IN_ROOM", message: "この部屋に参加していません" } },
        { status: 400 }
      );
    }

    const guest = await prisma.guest.findUnique({
      where: { guestSessionId },
      select: { displayName: true },
    });
    const displayName = guest?.displayName ?? "ゲスト";
    const now = new Date();

    await prisma.roomParticipant.update({
      where: { id: guestParticipant.id },
      data: { leftAt: now },
    });

    const leaveMsg = await prisma.chatMessage.create({
      data: { roomId, content: `${displayName}さんが退室しました`, isSystem: true },
    });
    await emitToRoom("chat:message", roomId, {
      id: leaveMsg.id,
      roomId,
      user: null,
      content: leaveMsg.content,
      isSystem: true,
      createdAt: leaveMsg.createdAt,
    });
    await emitToRoom("room:user_left", roomId, {
      userId: guestSessionId,
      username: displayName,
      leftAt: now,
    });

    return new NextResponse(null, { status: 204 });
  }

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

  const leavingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });
  const leavingUsername = leavingUser?.username ?? "ユーザー";

  const result = await prisma.$transaction((tx) =>
    leaveRoomInTx(tx, {
      roomId,
      participantId: participant.id,
      isHost: participant.isHost,
      userId,
      username: leavingUsername,
      now,
    })
  );

  await emitLeaveRoomEvents(roomId, userId, leavingUsername, result);

  return new NextResponse(null, { status: 204 });
}
