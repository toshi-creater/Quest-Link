import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ roomId: string }> };

export async function POST(request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
      { status: 401 }
    );
  }

  const { roomId } = await params;
  const reviewerId = session.user.id;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "リクエストボディが不正です" } },
      { status: 400 }
    );
  }

  const { revieweeId, score, comment } = body as {
    revieweeId: unknown;
    score: unknown;
    comment?: unknown;
  };

  if (
    typeof score !== "number" ||
    !Number.isInteger(score) ||
    score < 1 ||
    score > 5
  ) {
    return NextResponse.json(
      { error: { code: "INVALID_SCORE", message: "スコアは1〜5の整数で指定してください" } },
      { status: 400 }
    );
  }

  if (typeof revieweeId !== "string" || !revieweeId) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "revieweeId が不正です" } },
      { status: 400 }
    );
  }

  if (revieweeId === reviewerId) {
    return NextResponse.json(
      { error: { code: "SELF_RATING", message: "自分自身を評価することはできません" } },
      { status: 400 }
    );
  }

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

  const reviewerParticipant = await prisma.roomParticipant.findFirst({
    where: { roomId, userId: reviewerId },
    select: { leftAt: true },
  });

  if (!reviewerParticipant) {
    return NextResponse.json(
      { error: { code: "NOT_PARTICIPATED", message: "この部屋に参加していません" } },
      { status: 403 }
    );
  }

  const baseTime = reviewerParticipant.leftAt ?? room.closedAt;

  if (!baseTime) {
    return NextResponse.json(
      { error: { code: "NOT_LEFT", message: "まだ部屋に参加中です" } },
      { status: 400 }
    );
  }

  const expiresAt = new Date(baseTime.getTime() + 24 * 60 * 60 * 1000);
  const now = new Date();

  if (now > expiresAt) {
    return NextResponse.json(
      { error: { code: "RATING_EXPIRED", message: "評価期限が切れています" } },
      { status: 400 }
    );
  }

  const revieweeParticipant = await prisma.roomParticipant.findFirst({
    where: { roomId, userId: revieweeId },
  });

  if (!revieweeParticipant) {
    return NextResponse.json(
      { error: { code: "NOT_PARTICIPATED", message: "評価対象のユーザーはこの部屋に参加していません" } },
      { status: 403 }
    );
  }

  const existing = await prisma.rating.findFirst({
    where: { roomId, reviewerId, revieweeId },
  });

  if (existing) {
    return NextResponse.json(
      { error: { code: "ALREADY_RATED", message: "既にこのユーザーを評価済みです" } },
      { status: 409 }
    );
  }

  const rating = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const newRating = await tx.rating.create({
      data: {
        roomId,
        reviewerId,
        revieweeId,
        score,
        comment: typeof comment === "string" ? comment : undefined,
        expiresAt,
      },
    });

    const aggregate = await tx.rating.aggregate({
      where: { revieweeId },
      _avg: { score: true },
      _count: { score: true },
    });

    await tx.user.update({
      where: { id: revieweeId },
      data: {
        avgRating: aggregate._avg.score ?? 0,
        ratingCount: aggregate._count.score,
      },
    });

    return newRating;
  });

  return NextResponse.json(
    {
      data: {
        id: rating.id,
        roomId: rating.roomId,
        revieweeId: rating.revieweeId,
        score: rating.score,
        comment: rating.comment,
        createdAt: rating.createdAt,
        expiresAt: rating.expiresAt,
      },
    },
    { status: 201 }
  );
}
