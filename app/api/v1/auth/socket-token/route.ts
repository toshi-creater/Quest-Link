import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { encode } from "next-auth/jwt";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const GUEST_ID_RE = /^guest_[0-9a-f]{32}$/;

export async function GET() {
  const session = await auth();

  if (session?.user?.id) {
    const token = await encode({
      token: { userId: session.user.id },
      secret: process.env.AUTH_SECRET ?? "",
      salt: "socket-auth",
      maxAge: 60,
    });
    return NextResponse.json({ token });
  }

  // ゲストセッション確認
  const cookieStore = await cookies();
  const guestSessionId = cookieStore.get("quest_link_guest_session")?.value ?? "";

  if (!GUEST_ID_RE.test(guestSessionId)) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
      { status: 401 }
    );
  }

  const participant = await prisma.roomParticipant.findFirst({
    where: { guestSessionId, leftAt: null },
    select: { id: true },
  });

  if (!participant) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
      { status: 401 }
    );
  }

  const token = await encode({
    token: { guestSessionId },
    secret: process.env.AUTH_SECRET ?? "",
    salt: "socket-auth",
    maxAge: 60,
  });

  return NextResponse.json({ token });
}
