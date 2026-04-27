import Link from "next/link";
import { Crown, Users } from "@phosphor-icons/react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { RatingDisplay } from "@/components/ui/StarRating";
import type { RoomParticipant } from "@/lib/api/rooms";

type ParticipantSidebarProps = {
  participants: RoomParticipant[];
  maxPlayers: number;
  currentPlayers: number;
  currentUserId: string | null;
  currentGuestSessionId: string | null;
};

export function ParticipantSidebar({
  participants,
  maxPlayers,
  currentPlayers,
  currentUserId,
  currentGuestSessionId,
}: ParticipantSidebarProps) {
  return (
    <div className="space-y-4">
      <div
        className="rounded-2xl p-4 sm:p-5"
        style={{ backgroundColor: "var(--bg-card)" }}
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
              {currentPlayers}
            </span>
            /{maxPlayers}
          </span>
        </div>

        {/* Progress bar */}
        <div
          className="mb-4 h-2 w-full rounded-full overflow-hidden"
          style={{ backgroundColor: "rgba(255,255,255,0.1)" }}
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${(currentPlayers / maxPlayers) * 100}%`,
              background: "linear-gradient(90deg, var(--accent), var(--accent-light))",
            }}
          />
        </div>

        <ul className="space-y-3">
          {participants.map((p, idx) => (
            <li
              key={p.userId ?? p.guestSessionId ?? `participant-${idx}`}
              className="flex items-center gap-3"
            >
              {p.userId != null ? (
                <Link
                  href={p.userId === currentUserId ? "/users/me" : `/users/${p.userId}`}
                  className="shrink-0"
                >
                  <UserAvatar username={p.username} iconUrl={p.iconUrl} size="md" />
                </Link>
              ) : (
                <span className="shrink-0">
                  <UserAvatar username={p.username} iconUrl={p.iconUrl} size="md" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {p.isHost && (
                    <Crown className="h-3.5 w-3.5 shrink-0" style={{ color: "#eab308" }} />
                  )}
                  {p.userId != null ? (
                    <Link
                      href={p.userId === currentUserId ? "/users/me" : `/users/${p.userId}`}
                      className="truncate text-sm font-medium hover:underline"
                      style={{
                        color:
                          p.userId === currentUserId
                            ? "var(--accent-light)"
                            : "var(--text-primary)",
                      }}
                    >
                      {p.username}
                      {p.userId === currentUserId && (
                        <span className="ml-1 text-xs" style={{ color: "var(--text-muted)" }}>
                          (あなた)
                        </span>
                      )}
                    </Link>
                  ) : (
                    <span
                      className="truncate text-sm font-medium"
                      style={{
                        color:
                          currentGuestSessionId !== null &&
                          p.guestSessionId === currentGuestSessionId
                            ? "var(--accent-light)"
                            : "var(--text-primary)",
                      }}
                    >
                      {p.username}
                    </span>
                  )}
                  {p.userId == null && (
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
                  avgRating={p.avgRating}
                  ratingCount={p.avgRating != null ? 10 : 3}
                  size="sm"
                />
              </div>
            </li>
          ))}
          {Array.from({ length: maxPlayers - currentPlayers }).map((_, i) => (
            <li
              key={`empty-${i}`}
              className="flex items-center gap-3 rounded-lg px-3 py-2"
              style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
            >
              <div
                className="h-9 w-9 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.06)" }}
              />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                募集中...
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
