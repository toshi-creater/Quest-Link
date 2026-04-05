import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { emitToRoom } from "@/lib/socket-emitter";
import { Prisma } from "@prisma/client";

const bodySchema = z.object({
  displayName: z
    .string()
    .max(50)
    .optional()
    .transform((v) => v?.trim() ?? ""),
});

type RouteParams = { params: Promise<{ token: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const { token } = await params;

  const parsed = bodySchema.safeParse(
    await request.json().catch(() => ({}))
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "入力値が不正です" } },
      { status: 400 }
    );
  }
  const rawName = parsed.data.displayName;

  const room = await prisma.room.findUnique({
    where: { inviteToken: token },
    select: { id: true, status: true, maxPlayers: true },
  });

  if (!room) {
    return NextResponse.json(
      { error: { code: "INVITE_NOT_FOUND", message: "招待リンクが無効です" } },
      { status: 404 }
    );
  }

  if (room.status === "closed") {
    return NextResponse.json(
      { error: { code: "ROOM_CLOSED", message: "この部屋はすでに終了しています" } },
      { status: 400 }
    );
  }

  const cookieStore = await cookies();
  const existingSession = cookieStore.get("quest_link_guest_session")?.value ?? null;
  if (existingSession) {
    const existing = await prisma.roomParticipant.findFirst({
      where: { roomId: room.id, guestSessionId: existingSession, leftAt: null },
    });
    if (existing) {
      return NextResponse.json(
        { error: { code: "ALREADY_JOINED", message: "すでにこの部屋に参加しています" } },
        { status: 409 }
      );
    }
  }

  const guestSessionId = "guest_" + randomBytes(16).toString("hex");
  const displayName =
    rawName.length > 0 ? rawName : `Guest${randomBytes(2).readUInt16BE(0)}`;

  try {
    const participant = await prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw`SELECT id FROM rooms WHERE id = ${room.id}::uuid FOR UPDATE`;

        const currentCount = await tx.roomParticipant.count({
          where: { roomId: room.id, leftAt: null },
        });

        if (currentCount >= room.maxPlayers) {
          throw new Error("ROOM_FULL");
        }

        const p = await tx.roomParticipant.create({
          data: { roomId: room.id, guestSessionId, displayName, isHost: false },
        });

        if (currentCount + 1 >= room.maxPlayers) {
          await tx.room.update({
            where: { id: room.id },
            data: { status: "full" },
          });
        }

        return p;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    const systemMsg = await prisma.chatMessage.create({
      data: {
        roomId: room.id,
        content: `${displayName}さんが入室しました`,
        isSystem: true,
      },
    });

    await emitToRoom("chat:message", room.id, {
      id: systemMsg.id,
      roomId: room.id,
      user: null,
      content: systemMsg.content,
      isSystem: true,
      createdAt: systemMsg.createdAt,
    });

    await emitToRoom("room:user_joined", room.id, {
      userId: guestSessionId,
      username: displayName,
      iconUrl: null,
      avgRating: 0,
      isGuest: true,
      joinedAt: participant.joinedAt,
    });

    const response = NextResponse.json({
      data: {
        roomId: room.id,
        guestSessionId,
        isGuest: true,
        joinedAt: participant.joinedAt,
      },
    });

    response.cookies.set("quest_link_guest_session", guestSessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 86400,
      path: "/",
      sameSite: "lax",
    });

    return response;
  } catch (error) {
    if (error instanceof Error && error.message === "ROOM_FULL") {
      return NextResponse.json(
        { error: { code: "ROOM_FULL", message: "この部屋は満員です" } },
        { status: 409 }
      );
    }
    throw error;
  }
}
