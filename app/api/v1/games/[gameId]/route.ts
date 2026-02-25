import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getGameById } from "@/lib/igdb";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "認証が必要です。" } }, { status: 401 });
  }

  const { gameId } = await params;
  const game = await getGameById(gameId);

  if (!game) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "指定したゲームが存在しません。" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: game });
}
