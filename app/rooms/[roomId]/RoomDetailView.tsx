"use client";

import Link from "next/link";
import Image from "next/image";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { ArrowLeft, Crown, Loader2, MessageSquare, Users } from "lucide-react";
import { fetchRoom } from "@/lib/api/rooms";
import { roomStatusConfig, fallbackStatusConfig } from "@/lib/room-status";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { PlayStyleTag } from "@/components/ui/PlayStyleTag";
import { RatingDisplay } from "@/components/ui/StarRating";
import { GameCover } from "@/components/ui/GamePicker";
import { RoomActions } from "./RoomActions";

type Props = { roomId: string };

export function RoomDetailView({ roomId }: Props) {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;

  const { data, isLoading, isError } = useQuery({
    queryKey: ["room", roomId],
    queryFn: () => fetchRoom(roomId),
    enabled: !!currentUserId,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-32">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: "var(--accent)" }} />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <p className="text-lg font-medium" style={{ color: "var(--text-secondary)" }}>
          部屋が見つかりませんでした
        </p>
        <Link
          href="/rooms"
          className="mt-4 text-sm"
          style={{ color: "var(--accent-light)" }}
        >
          部屋一覧に戻る
        </Link>
      </div>
    );
  }

  const room = data.data;
  const status = roomStatusConfig[room.status as keyof typeof roomStatusConfig] ?? fallbackStatusConfig;
  const isParticipant = room.participants.some((p) => p.userId === currentUserId);
  const isHost = room.host.id === currentUserId;

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

      <div className="grid gap-6 md:grid-cols-[1fr_260px] lg:grid-cols-3">
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
              {room.game.coverImageUrl && (
                <Image
                  src={room.game.coverImageUrl}
                  alt=""
                  aria-hidden
                  fill
                  className="pointer-events-none object-cover opacity-25 blur-sm scale-110"
                  sizes="800px"
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
                      {new Date(room.createdAt).toLocaleString("ja-JP", {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
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
              className="flex items-center justify-between rounded-xl border px-5 py-4 transition-all hover:border-[var(--accent)]"
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
                  <Link
                    href={p.userId === currentUserId ? "/users/me" : `/users/${p.userId}`}
                    className="shrink-0"
                  >
                    <UserAvatar username={p.username} iconUrl={p.iconUrl} size="md" />
                  </Link>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {p.isHost && (
                        <Crown className="h-3.5 w-3.5 shrink-0" style={{ color: "#eab308" }} />
                      )}
                      <Link
                        href={p.userId === currentUserId ? "/users/me" : `/users/${p.userId}`}
                        className="truncate text-sm font-medium hover:underline"
                        style={{
                          color: p.userId === currentUserId ? "var(--accent-light)" : "var(--text-primary)",
                        }}
                      >
                        {p.username}
                        {p.userId === currentUserId && (
                          <span className="ml-1 text-xs" style={{ color: "var(--text-muted)" }}>
                            (あなた)
                          </span>
                        )}
                      </Link>
                    </div>
                    <RatingDisplay
                      avgRating={p.avgRating}
                      ratingCount={p.avgRating != null ? 10 : 3}
                      size="sm"
                    />
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
