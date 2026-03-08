import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

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
      game: { select: { id: true, name: true, coverUrl: true } },
    },
  },
} satisfies Prisma.UserSelect;

type RawUser = Prisma.UserGetPayload<{ select: typeof profileSelect }>;

function formatUser(user: RawUser) {
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
  };
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { userId } = await params;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: profileSelect,
  });

  if (!user) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  }

  return NextResponse.json({ data: formatUser(user) });
}
