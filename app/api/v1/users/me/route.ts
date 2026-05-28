import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { leaveRoomInTx, emitLeaveRoomEvents } from "@/lib/leave-room";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const patchSchema = z.object({
  username: z.string().min(1, "ユーザー名は必須です").max(50, "ユーザー名は50文字以内").optional(),
  bio: z.string().max(500, "自己紹介は500文字以内").nullable().optional(),
  iconUrl: z.string().nullable().optional(),
  playStyleTagIds: z.array(z.string().uuid()).optional(),
  gameIds: z.array(z.string().uuid()).max(20, "ゲームは最大20件").optional(),
});

const profileSelect = {
  id: true,
  username: true,
  iconUrl: true,
  bio: true,
  avgRating: true,
  ratingCount: true,
  createdAt: true,
  playStyleTags: {
    select: {
      tag: { select: { id: true, name: true, slug: true } },
    },
  },
  games: {
    select: {
      game: { select: { id: true, name: true, coverImageUrl: true } },
    },
  },
} satisfies Prisma.UserSelect;

const receivedRatingsSelect = {
  id: true,
  score: true,
  comment: true,
  createdAt: true,
  reviewer: {
    select: { username: true, iconUrl: true },
  },
} satisfies Prisma.RatingSelect;

type RawUser = Prisma.UserGetPayload<{ select: typeof profileSelect }>;
type RawRating = Prisma.RatingGetPayload<{ select: typeof receivedRatingsSelect }>;

function formatUser(user: RawUser, receivedRatings: RawRating[]) {
  return {
    id: user.id,
    username: user.username,
    iconUrl: user.iconUrl,
    bio: user.bio,
    avgRating: Number(user.avgRating),
    ratingCount: user.ratingCount,
    createdAt: user.createdAt,
    playStyleTags: user.playStyleTags.map((t) => t.tag),
    games: user.games.map((g) => g.game),
    receivedRatings: receivedRatings.map((r) => ({
      id: r.id,
      score: r.score,
      comment: r.comment,
      createdAt: r.createdAt,
      reviewer: r.reviewer,
    })),
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const [user, receivedRatings] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: profileSelect }),
    prisma.rating.findMany({
      where: { revieweeId: session.user.id },
      select: receivedRatingsSelect,
      orderBy: { createdAt: "desc" },
      take: 20,
    }),
  ]);

  if (!user) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ data: formatUser(user, receivedRatings) });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body: unknown = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "BAD_REQUEST", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { username, bio, iconUrl, playStyleTagIds, gameIds } = parsed.data;

  if (playStyleTagIds !== undefined && playStyleTagIds.length > 0) {
    const validTags = await prisma.playStyleTag.findMany({
      where: { id: { in: playStyleTagIds }, isActive: true },
      select: { id: true },
    });
    if (validTags.length !== playStyleTagIds.length) {
      return NextResponse.json({ error: "INVALID_TAG" }, { status: 400 });
    }
  }

  if (gameIds !== undefined && gameIds.length > 0) {
    const validGames = await prisma.game.findMany({
      where: { id: { in: gameIds } },
      select: { id: true },
    });
    if (validGames.length !== gameIds.length) {
      return NextResponse.json({ error: "INVALID_GAME" }, { status: 400 });
    }
  }

  try {
    const user = await prisma.$transaction(async (tx) => {
      if (playStyleTagIds !== undefined) {
        await tx.userPlayStyleTag.deleteMany({
          where: { userId: session.user.id },
        });
      }
      if (gameIds !== undefined) {
        await tx.userGame.deleteMany({ where: { userId: session.user.id } });
      }
      return tx.user.update({
        where: { id: session.user.id },
        data: {
          ...(username !== undefined && { username: username.trim() }),
          ...(bio !== undefined && { bio: bio ?? null }),
          ...(iconUrl !== undefined && { iconUrl: iconUrl || null }),
          ...(playStyleTagIds !== undefined &&
            playStyleTagIds.length > 0 && {
              playStyleTags: {
                createMany: {
                  data: playStyleTagIds.map((tagId) => ({ tagId })),
                },
              },
            }),
          ...(gameIds !== undefined &&
            gameIds.length > 0 && {
              games: {
                createMany: {
                  data: gameIds.map((gameId) => ({ gameId })),
                },
              },
            }),
        },
        select: profileSelect,
      });
    });

    return NextResponse.json({ data: formatUser(user, []) });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ error: "USERNAME_TAKEN" }, { status: 409 });
    }
    return NextResponse.json(
      { error: "INTERNAL_SERVER_ERROR" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const userId = session.user.id;

  const leavingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true },
  });
  const username = leavingUser?.username ?? "ユーザー";

  const now = new Date();
  const leaveResults: Array<{ roomId: string; result: Awaited<ReturnType<typeof leaveRoomInTx>> }> = [];

  await prisma.$transaction(async (tx) => {
    const activeParticipants = await tx.roomParticipant.findMany({
      where: { userId, leftAt: null },
      select: { id: true, roomId: true, isHost: true },
    });

    for (const p of activeParticipants) {
      const result = await leaveRoomInTx(tx, {
        roomId: p.roomId,
        participantId: p.id,
        isHost: p.isHost,
        userId,
        username,
        now,
      });
      leaveResults.push({ roomId: p.roomId, result });
    }
    await tx.user.delete({ where: { id: userId } });
  });

  for (const { roomId, result } of leaveResults) {
    await emitLeaveRoomEvents(roomId, userId, username, result);
  }

  return new NextResponse(null, { status: 204 });
}
