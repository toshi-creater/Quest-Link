import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    username?: string;
    bio?: string;
    iconUrl?: string | null;
  };

  const { username, bio, iconUrl } = body;

  if (username !== undefined) {
    if (typeof username !== "string" || username.trim().length === 0) {
      return NextResponse.json(
        { error: "ユーザー名は必須です" },
        { status: 400 }
      );
    }
    if (username.trim().length > 50) {
      return NextResponse.json(
        { error: "ユーザー名は50文字以内で入力してください" },
        { status: 400 }
      );
    }
  }

  if (bio !== undefined && typeof bio === "string" && bio.length > 500) {
    return NextResponse.json(
      { error: "自己紹介は500文字以内で入力してください" },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(username !== undefined && { username: username.trim() }),
        ...(bio !== undefined && { bio: bio || null }),
        ...(iconUrl !== undefined && { iconUrl: iconUrl || null }),
      },
      select: {
        id: true,
        username: true,
        iconUrl: true,
        bio: true,
        avgRating: true,
      },
    });

    return NextResponse.json({ data: user });
  } catch (error) {
    // ユーザー名の一意制約違反
    if (
      error instanceof Error &&
      error.message.includes("Unique constraint")
    ) {
      return NextResponse.json(
        { error: "このユーザー名はすでに使用されています" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "プロフィールの更新に失敗しました" },
      { status: 500 }
    );
  }
}
