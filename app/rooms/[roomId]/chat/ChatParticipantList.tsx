"use client";

import { Crown } from "@phosphor-icons/react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { PlayStyleTag } from "@/components/ui/PlayStyleTag";
import { RatingDisplay } from "@/components/ui/StarRating";
import { KickButton } from "@/components/rooms/KickButton";
import { useChatStore } from "@/lib/stores/chatStore";
import { useMyBlocks } from "@/lib/hooks/useMyBlocks";
import { BackButton } from "@/components/ui/BackButton";

type Tag = { id: string; name: string; slug: string };

type Props = {
  roomId: string;
  currentUserId: string | null;
  currentGuestSessionId: string | null;
  isCurrentUserHost: boolean;
  maxPlayers: number;
  roomTitle: string;
  gameName: string;
  tags: Tag[];
};

export function ChatParticipantList({
  roomId,
  currentUserId,
  currentGuestSessionId,
  isCurrentUserHost,
  maxPlayers,
  roomTitle,
  gameName,
  tags,
}: Props) {
  const allParticipants = useChatStore((s) => s.participants);
  const blockedIds = useMyBlocks();
  const participants = allParticipants.filter(
    (p) => !p.userId || !blockedIds.has(p.userId)
  );
  const currentPlayers = participants.length;

  return (
    <aside
      className="hidden w-64 shrink-0 flex-col md:flex"
      style={{ backgroundColor: "var(--bg-card)" }}
    >
      {/* Room info */}
      <div className="p-4">
        <BackButton href={`/rooms/${roomId}`} />
        <h2 className="text-sm font-bold leading-snug" style={{ color: "var(--text-primary)" }}>
          {roomTitle}
        </h2>
        <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
          {gameName}
        </p>
        {tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {tags.map((tag) => (
              <PlayStyleTag key={tag.id} tag={tag} size="sm" />
            ))}
          </div>
        )}
      </div>

      {/* Participants */}
      <div className="flex-1 overflow-y-auto p-4">
        <p
          className="mb-3 text-xs font-semibold uppercase tracking-wider"
          style={{ color: "var(--text-muted)" }}
        >
          参加者 {currentPlayers}/{maxPlayers}
        </p>
        <ul className="space-y-2.5">
          {participants.map((p, idx) => {
            const name = p.user?.username ?? p.displayName ?? "ゲスト";
            const iconUrl = p.user?.iconUrl ?? null;
            const avgRating = p.user?.avgRating ?? null;
            const isMe =
              (p.userId != null && p.userId === currentUserId) ||
              (currentGuestSessionId !== null && p.guestSessionId === currentGuestSessionId);
            const isGuest = p.user === null;
            const canKick = isCurrentUserHost && !isMe && !p.isHost;
            return (
              <li key={p.userId ?? `guest-${idx}`} className="flex items-center gap-2.5">
                <div className="relative shrink-0">
                  <UserAvatar username={name} iconUrl={iconUrl} size="sm" />
                  {!isGuest && (
                    <span
                      className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2"
                      style={{ backgroundColor: "#22c55e", borderColor: "var(--bg-card)" }}
                    />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1">
                    {p.isHost && <Crown className="h-3 w-3 shrink-0" style={{ color: "#eab308" }} />}
                    <span
                      className="truncate text-xs font-medium"
                      style={{ color: isMe ? "var(--accent-light)" : "var(--text-primary)" }}
                    >
                      {name}
                    </span>
                    {isGuest && (
                      <span
                        className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold leading-none"
                        style={{
                          backgroundColor: "rgba(34, 197, 94, 0.15)",
                          color: "#4ade80",
                        }}
                      >
                        ゲスト
                      </span>
                    )}
                  </div>
                  <RatingDisplay
                    avgRating={avgRating !== null ? Number(avgRating) : null}
                    ratingCount={avgRating != null ? 10 : 3}
                    size="sm"
                  />
                </div>
                {canKick && (
                  <KickButton
                    roomId={roomId}
                    target={
                      p.userId != null
                        ? { userId: p.userId }
                        : { guestSessionId: p.guestSessionId! }
                    }
                    targetName={name}
                  />
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}
