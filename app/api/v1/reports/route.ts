import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type ReportReason = "harassment" | "spam" | "hate_speech" | "inappropriate_content" | "other";
const VALID_REASONS: ReportReason[] = [
  "harassment",
  "spam",
  "hate_speech",
  "inappropriate_content",
  "other",
];

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "認証が必要です" } },
      { status: 401 }
    );
  }
  const reporterId = session.user.id;

  const body = (await request.json()) as {
    targetUserId?: string;
    targetMessageId?: string;
    reason?: string;
    detail?: string;
  };

  const { targetUserId, targetMessageId, reason, detail } = body;

  if (!targetUserId && !targetMessageId) {
    return NextResponse.json(
      { error: { code: "INVALID_REQUEST", message: "通報対象が指定されていません" } },
      { status: 400 }
    );
  }

  if (!reason || !VALID_REASONS.includes(reason as ReportReason)) {
    return NextResponse.json(
      { error: { code: "INVALID_REASON", message: "通報理由が無効です" } },
      { status: 400 }
    );
  }

  if (targetUserId === reporterId) {
    return NextResponse.json(
      { error: { code: "CANNOT_REPORT_SELF", message: "自分自身を通報できません" } },
      { status: 400 }
    );
  }

  if (targetUserId) {
    const user = await prisma.user.findUnique({ where: { id: targetUserId }, select: { id: true } });
    if (!user) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "ユーザーが存在しません" } },
        { status: 404 }
      );
    }
  }

  if (targetMessageId) {
    const msg = await prisma.chatMessage.findUnique({
      where: { id: targetMessageId },
      select: { id: true },
    });
    if (!msg) {
      return NextResponse.json(
        { error: { code: "MESSAGE_NOT_FOUND", message: "メッセージが存在しません" } },
        { status: 404 }
      );
    }
  }

  const report = await prisma.report.create({
    data: {
      reporterId,
      targetUserId: targetUserId ?? null,
      targetMessageId: targetMessageId ?? null,
      reason: reason as ReportReason,
      detail: detail ?? null,
    },
    select: { id: true, createdAt: true },
  });

  return NextResponse.json({ data: { id: report.id, createdAt: report.createdAt } }, { status: 201 });
}
