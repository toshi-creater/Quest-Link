import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { searchGames } from "@/lib/igdb";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: { code: "UNAUTHORIZED", message: "認証が必要です。" } }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const q = searchParams.get("q") ?? "";
  const limitParam = searchParams.get("limit");

  if (q.length === 0 || q.length > 100) {
    return NextResponse.json(
      { error: { code: "BAD_REQUEST", message: "q は1〜100文字で指定してください。" } },
      { status: 400 }
    );
  }

  const limit = Math.min(Math.max(parseInt(limitParam ?? "10", 10) || 10, 1), 20);

  try {
    const games = await searchGames(q, limit);
    return NextResponse.json({ data: games });
  } catch (error) {
    const msg = error instanceof Error ? error.message : "";
    if (msg === "IGDB_ERROR") {
      return NextResponse.json(
        { error: { code: "IGDB_ERROR", message: "IGDB API との通信に失敗しました。" } },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_SERVER_ERROR", message: "サーバーエラーが発生しました。" } },
      { status: 500 }
    );
  }
}
