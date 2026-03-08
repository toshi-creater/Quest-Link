import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchGames, getPopularGames } from "@/lib/games";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "認証が必要です。" } }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? "";
  const limitParam = searchParams.get("limit");

  if (q.length > 100) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "q は100文字以内で指定してください。" } },
      { status: 400 }
    );
  }

  const limit = Math.min(Math.max(parseInt(limitParam ?? "10", 10) || 10, 1), 20);

  try {
    const games = q.length === 0 ? await getPopularGames(limit) : await searchGames(q, limit);
    return NextResponse.json({ data: games });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "サーバーエラーが発生しました。" } },
      { status: 500 }
    );
  }
}
