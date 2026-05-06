import { auth } from "@/auth";
import { encode } from "next-auth/jwt";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
      { status: 401 }
    );
  }

  const token = await encode({
    token: { userId: session.user.id },
    secret: process.env.AUTH_SECRET ?? "",
    salt: "socket-auth",
    maxAge: 60,
  });

  return NextResponse.json({ token });
}
