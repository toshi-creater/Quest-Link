import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(
    100,
    Math.max(1, Number(searchParams.get("limit") ?? "20"))
  );

  const [total, participations] = await prisma.$transaction([
    prisma.roomParticipant.count({ where: { userId: session.user.id } }),
    prisma.roomParticipant.findMany({
      where: { userId: session.user.id },
      orderBy: { joinedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        isHost: true,
        joinedAt: true,
        leftAt: true,
        room: {
          select: {
            id: true,
            title: true,
            status: true,
            game: { select: { name: true } },
          },
        },
      },
    }),
  ]);

  const data = participations.map((p) => ({
    roomId: p.room.id,
    title: p.room.title,
    gameTitle: p.room.game.name,
    status: p.room.status,
    isHost: p.isHost,
    joinedAt: p.joinedAt,
    leftAt: p.leftAt,
  }));

  return NextResponse.json({ data, meta: { total, page, limit } });
}
