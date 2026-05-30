import { prisma } from "@/lib/prisma";
import { emitToRoom } from "@/lib/socket-emitter";

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

export type LeaveRoomResult =
  | {
      type: "host_changed";
      newHostId: string;
      newHostUsername: string;
      leaveMessageId: string;
      leaveMessageContent: string;
      leaveMessageCreatedAt: Date;
      systemMessageId: string;
      systemMessageContent: string;
      systemMessageCreatedAt: Date;
    }
  | {
      type: "room_closed";
      closedAt: Date;
      leaveMessageId: string;
      leaveMessageContent: string;
      leaveMessageCreatedAt: Date;
    }
  | {
      type: "normal";
      leaveMessageId: string;
      leaveMessageContent: string;
      leaveMessageCreatedAt: Date;
    };

export async function leaveRoomInTx(
  tx: TxClient,
  params: {
    roomId: string;
    participantId: string;
    isHost: boolean;
    userId: string;
    username: string;
    now: Date;
  }
): Promise<LeaveRoomResult> {
  const { roomId, participantId, isHost, userId, username, now } = params;

  await tx.roomParticipant.update({
    where: { id: participantId },
    data: { leftAt: now },
  });

  if (isHost) {
    const nextHost = await tx.roomParticipant.findFirst({
      where: { roomId, leftAt: null, userId: { not: userId } },
      orderBy: { joinedAt: "asc" },
      select: { id: true, userId: true, user: { select: { username: true } } },
    });

    const leaveMsg = await tx.chatMessage.create({
      data: { roomId, content: `${username}さんが退室しました`, isSystem: true },
    });

    if (nextHost?.userId) {
      await tx.roomParticipant.update({ where: { id: nextHost.id }, data: { isHost: true } });
      await tx.room.update({ where: { id: roomId }, data: { hostId: nextHost.userId } });
      const newHostUsername = nextHost.user?.username ?? "新しいホスト";
      const systemMsg = await tx.chatMessage.create({
        data: { roomId, content: `${newHostUsername}さんがホストになりました`, isSystem: true },
      });
      return {
        type: "host_changed",
        newHostId: nextHost.userId,
        newHostUsername,
        leaveMessageId: leaveMsg.id,
        leaveMessageContent: leaveMsg.content,
        leaveMessageCreatedAt: leaveMsg.createdAt,
        systemMessageId: systemMsg.id,
        systemMessageContent: systemMsg.content,
        systemMessageCreatedAt: systemMsg.createdAt,
      };
    } else {
      await tx.roomParticipant.updateMany({
        where: { roomId, leftAt: null },
        data: { leftAt: now },
      });
      await tx.room.update({ where: { id: roomId }, data: { status: "closed", closedAt: now } });
      return {
        type: "room_closed",
        closedAt: now,
        leaveMessageId: leaveMsg.id,
        leaveMessageContent: leaveMsg.content,
        leaveMessageCreatedAt: leaveMsg.createdAt,
      };
    }
  }

  const leaveMsg = await tx.chatMessage.create({
    data: { roomId, content: `${username}さんが退室しました`, isSystem: true },
  });
  return {
    type: "normal",
    leaveMessageId: leaveMsg.id,
    leaveMessageContent: leaveMsg.content,
    leaveMessageCreatedAt: leaveMsg.createdAt,
  };
}

export async function emitLeaveRoomEvents(
  roomId: string,
  userId: string,
  username: string,
  result: LeaveRoomResult
): Promise<void> {
  await emitToRoom("chat:message", roomId, {
    id: result.leaveMessageId,
    roomId,
    user: null,
    content: result.leaveMessageContent,
    isSystem: true,
    createdAt: result.leaveMessageCreatedAt,
  });
  await emitToRoom("room:user_left", roomId, { userId, username, leftAt: new Date() });

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
    await emitToRoom("room:closed", roomId, { roomId, closedAt: result.closedAt });
  }
}
