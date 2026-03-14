import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ roomId: string }> };

export async function GET(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
      { status: 401 }
    );
  }

  const { roomId } = await params;
  const currentUserId = session.user.id;

  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { id: true, closedAt: true },
  });

  if (!room) {
    return NextResponse.json(
      { error: { code: "ROOM_NOT_FOUND", message: "部屋が存在しません" } },
      { status: 404 }
    );
  }

  if (!room.closedAt) {
    return NextResponse.json({ data: [] });
  }

  const expiresAt = new Date(room.closedAt.getTime() + 24 * 60 * 60 * 1000);
  const now = new Date();

  if (now > expiresAt) {
    return NextResponse.json({ data: [] });
  }

  const [participants, ratedUsers] = await Promise.all([
    prisma.roomParticipant.findMany({
      where: { roomId, userId: { not: currentUserId } },
      select: {
        userId: true,
        user: {
          select: {
            username: true,
            iconUrl: true,
            avgRating: true,
          },
        },
      },
    }),
    prisma.rating.findMany({
      where: { roomId, reviewerId: currentUserId },
      select: { revieweeId: true },
    }),
  ]);

  const ratedUserIds = new Set(ratedUsers.map((r) => r.revieweeId));

  const pendingUsers = participants
    .filter((p) => p.userId !== null && !ratedUserIds.has(p.userId as string))
    .map((p) => ({
      userId: p.userId,
      username: p.user?.username ?? "",
      iconUrl: p.user?.iconUrl ?? null,
      avgRating: p.user?.avgRating !== null && p.user?.avgRating !== undefined
        ? Number(p.user.avgRating)
        : null,
      expiresAt,
    }));

  return NextResponse.json({ data: pendingUsers });
}
