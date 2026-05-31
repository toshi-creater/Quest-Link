import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
      { status: 401 }
    );
  }
  const blockerId = session.user.id;

  type BlockRow = {
    blockedId: string;
    createdAt: Date;
    blocked: { username: string; iconUrl: string | null };
  };

  const blocks = (await prisma.block.findMany({
    where: { blockerId },
    select: {
      blockedId: true,
      createdAt: true,
      blocked: { select: { username: true, iconUrl: true } },
    },
    orderBy: { createdAt: "desc" },
  })) as BlockRow[];

  return NextResponse.json({
    data: blocks.map((b) => ({
      blockedId: b.blockedId,
      username: b.blocked.username,
      iconUrl: b.blocked.iconUrl,
      createdAt: b.createdAt,
    })),
  });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
      { status: 401 }
    );
  }
  const blockerId = session.user.id;

  const body = (await request.json()) as { userId?: string };
  const { userId: blockedId } = body;

  if (!blockedId) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "ユーザーIDが必要です" } },
      { status: 400 }
    );
  }

  if (blockedId === blockerId) {
    return NextResponse.json(
      { error: { code: "CANNOT_BLOCK_SELF", message: "自分自身をブロックできません" } },
      { status: 400 }
    );
  }

  const target = await prisma.user.findUnique({ where: { id: blockedId }, select: { id: true } });
  if (!target) {
    return NextResponse.json(
      { error: { code: "USER_NOT_FOUND", message: "ユーザーが存在しません" } },
      { status: 404 }
    );
  }

  const existing = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    select: { blockerId: true },
  });
  if (existing) {
    return NextResponse.json(
      { error: { code: "ALREADY_BLOCKED", message: "既にブロック済みです" } },
      { status: 409 }
    );
  }

  await prisma.block.create({ data: { blockerId, blockedId } });

  return new NextResponse(null, { status: 204 });
}
