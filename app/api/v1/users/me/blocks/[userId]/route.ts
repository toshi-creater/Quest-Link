import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ userId: string }> };

export async function DELETE(_request: Request, { params }: RouteParams) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
      { status: 401 }
    );
  }
  const blockerId = session.user.id;
  const { userId: blockedId } = await params;

  const existing = await prisma.block.findUnique({
    where: { blockerId_blockedId: { blockerId, blockedId } },
    select: { blockerId: true },
  });

  if (!existing) {
    return NextResponse.json(
      { error: { code: "NOT_BLOCKED", message: "ブロックしていません" } },
      { status: 404 }
    );
  }

  await prisma.block.delete({
    where: { blockerId_blockedId: { blockerId, blockedId } },
  });

  return new NextResponse(null, { status: 204 });
}
