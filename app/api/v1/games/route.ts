import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "認証が必要です。" } }, { status: 401 });
  }

  try {
    const games = await prisma.game.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      select: { id: true, name: true, coverImageUrl: true },
    });
    return NextResponse.json({ data: games });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "サーバーエラーが発生しました。" } },
      { status: 500 }
    );
  }
}
