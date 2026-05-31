import { after, NextResponse } from "next/server";
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

    const [guestParticipant, guest] = await Promise.all([
      prisma.roomParticipant.findFirst({ where: { roomId, guestSessionId, leftAt: null } }),
      prisma.guest.findUnique({ where: { guestSessionId }, select: { displayName: true } }),
    ]);

    if (!guestParticipant) {
      return NextResponse.json(
        { error: { code: "NOT_IN_ROOM", message: "この部屋に参加していません" } },
        { status: 400 }
      );
    }

    const displayName = guest?.displayName ?? "ゲスト";
    const now = new Date();

    await prisma.roomParticipant.update({
      where: { id: guestParticipant.id },
      data: { leftAt: now },
    });

    const response = new NextResponse(null, { status: 204 });
    after(async () => {
      const leaveMsg = await prisma.chatMessage.create({
        data: { roomId, content: `${displayName}さんが退室しました`, isSystem: true },
      });
      await Promise.all([
        emitToRoom("chat:message", roomId, {
          id: leaveMsg.id,
          roomId,
          user: null,
          content: leaveMsg.content,
          isSystem: true,
          createdAt: leaveMsg.createdAt,
        }),
        emitToRoom("room:user_left", roomId, {
          userId: guestSessionId,
          username: displayName,
          leftAt: now,
        }),
      ]);
    });
    return response;
  }

  const userId = session.user.id;

  const [room, participant, leavingUser] = await Promise.all([
    prisma.room.findUnique({ where: { id: roomId }, select: { id: true, status: true } }),
    prisma.roomParticipant.findFirst({ where: { roomId, userId, leftAt: null } }),
    prisma.user.findUnique({ where: { id: userId }, select: { username: true } }),
  ]);

  if (!room) {
    return NextResponse.json(
      { error: { code: "ROOM_NOT_FOUND", message: "部屋が存在しません" } },
      { status: 404 }
    );
  }

  if (!participant) {
    return NextResponse.json(
      { error: { code: "NOT_IN_ROOM", message: "この部屋に参加していません" } },
      { status: 400 }
    );
  }

  const leavingUsername = leavingUser?.username ?? "ユーザー";
  const now = new Date();

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

  const response = new NextResponse(null, { status: 204 });
  after(async () => {
    await emitLeaveRoomEvents(roomId, userId, leavingUsername, result);
  });
  return response;
}
