import Link from "next/link";
import { ArrowLeft, DoorOpen, Users } from "lucide-react";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { GameCover } from "@/components/ui/GamePicker";
import { PlayStyleTag } from "@/components/ui/PlayStyleTag";

export default async function CurrentRoomsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const participation = await prisma.roomParticipant.findFirst({
    where: { userId: session.user.id, leftAt: null },
    select: {
      isHost: true,
      joinedAt: true,
      room: {
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          maxPlayers: true,
          game: { select: { id: true, igdbId: true, name: true, coverUrl: true } },
          playStyleTags: {
            select: { tag: { select: { id: true, name: true, slug: true } } },
          },
          _count: { select: { participants: { where: { leftAt: null } } } },
        },
      },
    },
  });

  const room = participation?.room ?? null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/users/me"
        className="mb-6 flex items-center gap-2 text-sm transition-colors hover:text-white"
        style={{ color: "var(--text-secondary)" }}
      >
        <ArrowLeft className="h-4 w-4" />
        プロフィールに戻る
      </Link>

      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          参加中の部屋
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          現在参加中の部屋（最大1件）
        </p>
      </div>

      {!room ? (
        <div
          className="rounded-2xl border px-6 py-16 text-center"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <DoorOpen
            className="mx-auto mb-4 h-12 w-12 opacity-30"
            style={{ color: "var(--text-muted)" }}
          />
          <p className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
            現在参加中の部屋はありません
          </p>
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            部屋一覧から気になる部屋に参加してみましょう
          </p>
          <Link
            href="/rooms"
            className="mt-5 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-light))" }}
          >
            部屋一覧を見る
          </Link>
        </div>
      ) : (
        <Link
          href={`/rooms/${room.id}`}
          className="block rounded-2xl border transition-all hover:border-purple-500/50"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <div className="flex items-start gap-4 p-5">
            <GameCover game={room.game} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium mb-0.5" style={{ color: "var(--accent-light)" }}>
                {room.game.name}
              </p>
              <h2 className="text-base font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                {room.title}
              </h2>
              {room.description && (
                <p
                  className="mt-1 text-xs line-clamp-2 leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {room.description}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-3">
                {/* 参加人数 */}
                <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-secondary)" }}>
                  <Users className="h-3.5 w-3.5" />
                  <span>
                    {room._count.participants} / {room.maxPlayers}
                  </span>
                </div>

                {/* ステータス */}
                <span
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={
                    room.status === "waiting"
                      ? {
                          backgroundColor: "rgba(34,197,94,0.12)",
                          color: "#4ade80",
                          border: "1px solid rgba(34,197,94,0.3)",
                        }
                      : {
                          backgroundColor: "rgba(234,179,8,0.12)",
                          color: "#facc15",
                          border: "1px solid rgba(234,179,8,0.3)",
                        }
                  }
                >
                  {room.status === "waiting" ? "募集中" : "プレイ中"}
                </span>

                {/* ホストバッジ */}
                {participation?.isHost && (
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: "rgba(124,58,237,0.15)",
                      color: "var(--accent-light)",
                      border: "1px solid rgba(124,58,237,0.3)",
                    }}
                  >
                    ホスト
                  </span>
                )}
              </div>

              {room.playStyleTags.length > 0 && (
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {room.playStyleTags.map(({ tag }) => (
                    <PlayStyleTag key={tag.id} tag={tag} />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div
            className="border-t px-5 py-3 text-xs"
            style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
          >
            入室日時:{" "}
            {participation?.joinedAt.toLocaleString("ja-JP", {
              month: "numeric",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </Link>
      )}
    </div>
  );
}
