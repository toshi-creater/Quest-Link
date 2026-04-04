import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ roomId: string }> };

export async function POST(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "認証が必要です" } }, { status: 401 });
  }

  const { roomId } = await params;

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { id: true, hostId: true, status: true, inviteToken: true },
  });

  if (!room) {
    return NextResponse.json({ error: { code: "ROOM_NOT_FOUND", message: "部屋が存在しません" } }, { status: 404 });
  }

  if (room.hostId !== session.user.id) {
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "ホストのみ招待リンクを発行できます" } }, { status: 403 });
  }

  if (room.status === "closed") {
    return NextResponse.json({ error: { code: "ROOM_CLOSED", message: "解散済みの部屋には招待リンクを発行できません" } }, { status: 400 });
  }

  if (room.inviteToken) {
    return NextResponse.json({ data: { inviteToken: room.inviteToken } });
  }

  const inviteToken = randomBytes(32).toString("hex");
  await prisma.room.update({
    where: { id: roomId },
    data: { inviteToken },
  });

  return NextResponse.json({ data: { inviteToken } });
}

export async function DELETE(_request: Request, { params }: RouteParams) {
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
    return NextResponse.json({ error: { code: "FORBIDDEN", message: "ホストのみ招待リンクを無効化できます" } }, { status: 403 });
  }

  if (room.status === "closed") {
    return NextResponse.json({ error: { code: "ROOM_CLOSED", message: "解散済みの部屋です" } }, { status: 400 });
  }

  await prisma.room.update({
    where: { id: roomId },
    data: { inviteToken: null },
  });

  return new NextResponse(null, { status: 204 });
}
