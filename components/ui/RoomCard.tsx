"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import type { RoomSummary } from "@/lib/api/rooms";
import { roomStatusConfig, fallbackStatusConfig } from "@/lib/room-status";
import { UserAvatar } from "./UserAvatar";
import { PlayStyleTag } from "./PlayStyleTag";
import { RatingDisplay } from "./StarRating";
import { GameCover } from "./GamePicker";

type Props = {
  room: RoomSummary;
};

export function RoomCard({ room }: Props) {
  const status = roomStatusConfig[room.status as keyof typeof roomStatusConfig] ?? fallbackStatusConfig;
  const fillRatio = room.currentPlayers / room.maxPlayers;

  return (
    <Link
      href={`/rooms/${room.id}`}
      className="group block rounded-xl border transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(124,58,237,0.5)] hover:shadow-[0_8px_24px_rgba(124,58,237,0.12)] overflow-hidden"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      {/* Game cover banner */}
      <div
        className="relative flex h-20 items-end overflow-hidden px-4"
        style={{ backgroundColor: "rgba(124,58,237,0.08)" }}
      >
        {/* Blurred cover as background */}
        {room.game.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={room.game.coverImageUrl}
            alt=""
            aria-hidden
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-20 blur-sm scale-110"
          />
        )}
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, var(--bg-card) 30%, transparent 100%)" }}
        />
        {/* Cover + status */}
        <div className="relative z-10 flex w-full items-center justify-between pb-3">
          <div className="flex items-center gap-3">
            <GameCover game={room.game} size="md" />
            <div>
              <p className="mb-0.5 text-xs font-medium" style={{ color: "var(--accent-light)" }}>
                {room.game.name}
              </p>
              <span
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                style={{ backgroundColor: status.bg, color: status.color, border: `1px solid ${status.border}` }}
              >
                {status.label}
              </span>
            </div>
          </div>
          {/* Player count */}
          <div className="flex flex-col items-start gap-1">
            <div className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} />
              <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                {room.currentPlayers}
                <span className="font-normal" style={{ color: "var(--text-muted)" }}>/{room.maxPlayers}</span>
              </span>
            </div>
            <div className="h-1.5 w-14 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
              <div
                className="h-full rounded-full"
                style={{
                  width: `${fillRatio * 100}%`,
                  backgroundColor: fillRatio >= 1 ? "#eab308" : fillRatio > 0.7 ? "#f97316" : "#22c55e",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-4 pt-2">
        <h3
          className="truncate text-sm font-semibold group-hover:text-white transition-colors"
          style={{ color: "var(--text-primary)" }}
        >
          {room.title}
        </h3>
        {room.description && (
          <p className="mt-1 text-xs line-clamp-1" style={{ color: "var(--text-secondary)" }}>
            {room.description}
          </p>
        )}

        {/* Tags */}
        {room.playStyleTags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {room.playStyleTags.map((tag) => (
              <PlayStyleTag key={tag.id} tag={tag} size="sm" />
            ))}
          </div>
        )}

        {/* Host */}
        <div className="mt-3 flex items-center gap-2 border-t pt-3" style={{ borderColor: "var(--border)" }}>
          <UserAvatar username={room.host.username} iconUrl={room.host.iconUrl} size="sm" />
          <span className="text-xs" style={{ color: "var(--text-secondary)" }}>
            {room.host.username}
          </span>
          <div className="ml-auto">
            <RatingDisplay avgRating={room.host.avgRating} ratingCount={room.host.avgRating != null ? 10 : 3} size="sm" />
          </div>
        </div>
      </div>
    </Link>
  );
}
