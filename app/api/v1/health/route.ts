import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const deep = request.nextUrl.searchParams.get("deep") === "1";

  if (!deep) {
    return NextResponse.json({ status: "ok" });
  }

  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ status: "ok", db: "ok" });
  } catch {
    return NextResponse.json({ status: "error", db: "error" }, { status: 503 });
  }
}
