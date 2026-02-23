import Link from "next/link";
import { ArrowLeft, Crown, MessageSquare, Users } from "lucide-react";
import { MOCK_ROOMS, CURRENT_USER } from "@/lib/mock-data";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { PlayStyleTag } from "@/components/ui/PlayStyleTag";
import { RatingDisplay } from "@/components/ui/StarRating";
import { GameCover } from "@/components/ui/GamePicker";
import { RoomActions } from "./RoomActions";

type Props = {
  params: Promise<{ roomId: string }>;
};

const statusConfig = {
  waiting: { label: "募集中", bg: "rgba(34,197,94,0.15)", color: "#22c55e", border: "rgba(34,197,94,0.3)" },
  playing: { label: "プレイ中", bg: "rgba(234,179,8,0.15)", color: "#eab308", border: "rgba(234,179,8,0.3)" },
  closed: { label: "終了", bg: "rgba(100,100,120,0.15)", color: "#8888aa", border: "rgba(100,100,120,0.3)" },
};

export default async function RoomDetailPage({ params }: Props) {
  const { roomId } = await params;
  const room = MOCK_ROOMS.find((r) => r.id === roomId) ?? MOCK_ROOMS[0];
  const status = statusConfig[room.status];
  const isParticipant = room.participants.some((p) => p.userId === CURRENT_USER.id);
  const isHost = room.host.id === CURRENT_USER.id;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Back */}
      <Link
        href="/rooms"
        className="mb-6 flex items-center gap-2 text-sm transition-colors hover:text-white"
        style={{ color: "var(--text-secondary)" }}
      >
        <ArrowLeft className="h-4 w-4" />
        部屋一覧
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Room Info */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            {/* Game cover header */}
            <div
              className="relative h-32 flex items-end px-6 pb-4 overflow-hidden"
              style={{ backgroundColor: "rgba(124,58,237,0.08)" }}
            >
              {room.game.coverUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={room.game.coverUrl}
                  alt=""
                  aria-hidden
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-25 blur-sm scale-110"
                />
              )}
              <div
                className="absolute inset-0"
                style={{ background: "linear-gradient(to top, var(--bg-card) 20%, transparent 80%)" }}
              />
              <div className="relative z-10 flex items-center gap-4">
                <GameCover game={room.game} size="lg" />
                <div>
                  <p className="text-sm font-semibold" style={{ color: "var(--accent-light)" }}>
                    {room.game.name}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{ backgroundColor: status.bg, color: status.color, border: `1px solid ${status.border}` }}
                    >
                      {status.label}
                    </span>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {new Date(room.createdAt).toLocaleString("ja-JP", { month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Room details */}
            <div className="px-6 py-5">
              <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
                {room.title}
              </h1>
              {room.description && (
                <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {room.description}
                </p>
              )}
              {room.playStyleTags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {room.playStyleTags.map((tag) => (
                    <PlayStyleTag key={tag.id} tag={tag} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <RoomActions
            roomId={room.id}
            isParticipant={isParticipant}
            isHost={isHost}
            status={room.status}
          />

          {/* Chat shortcut */}
          {isParticipant && (
            <Link
              href={`/rooms/${room.id}/chat`}
              className="flex items-center justify-between rounded-xl border px-5 py-4 transition-all hover:border-purple-500"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: "rgba(124,58,237,0.15)" }}
                >
                  <MessageSquare className="h-5 w-5" style={{ color: "var(--accent-light)" }} />
                </div>
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    チャットルームへ
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    リアルタイムでメッセージを送受信
                  </p>
                </div>
              </div>
              <ArrowLeft className="h-4 w-4 rotate-180" style={{ color: "var(--text-muted)" }} />
            </Link>
          )}
        </div>

        {/* Sidebar: Participants */}
        <div className="space-y-4">
          <div
            className="rounded-2xl border p-5"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                  参加者
                </span>
              </div>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                <span className="font-bold" style={{ color: "var(--text-primary)" }}>
                  {room.currentPlayers}
                </span>
                /{room.maxPlayers}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mb-4 h-2 w-full rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(room.currentPlayers / room.maxPlayers) * 100}%`,
                  background: "linear-gradient(90deg, var(--accent), var(--accent-light))",
                }}
              />
            </div>

            <ul className="space-y-3">
              {room.participants.map((p) => (
                <li key={p.userId} className="flex items-center gap-3">
                  <Link href={p.userId === CURRENT_USER.id ? "/users/me" : `/users/${p.userId}`} className="shrink-0">
                    <UserAvatar username={p.username} iconUrl={p.iconUrl} size="md" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {p.isHost && (
                        <Crown className="h-3.5 w-3.5 shrink-0" style={{ color: "#eab308" }} />
                      )}
                      <Link
                        href={p.userId === CURRENT_USER.id ? "/users/me" : `/users/${p.userId}`}
                        className="truncate text-sm font-medium hover:underline"
                        style={{ color: p.userId === CURRENT_USER.id ? "var(--accent-light)" : "var(--text-primary)" }}
                      >
                        {p.username}
                        {p.userId === CURRENT_USER.id && (
                          <span className="ml-1 text-xs" style={{ color: "var(--text-muted)" }}>
                            (あなた)
                          </span>
                        )}
                      </Link>
                    </div>
                    <RatingDisplay avgRating={p.avgRating} ratingCount={p.avgRating != null ? 10 : 3} size="sm" />
                  </div>
                </li>
              ))}
              {Array.from({ length: room.maxPlayers - room.currentPlayers }).map((_, i) => (
                <li
                  key={`empty-${i}`}
                  className="flex items-center gap-3 rounded-lg border border-dashed px-3 py-2"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div
                    className="h-9 w-9 rounded-full border-2 border-dashed"
                    style={{ borderColor: "var(--border)" }}
                  />
                  <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                    募集中...
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
