import Image from "next/image";
import { GameCover } from "@/components/ui/GamePicker";
import { PlayStyleTag } from "@/components/ui/PlayStyleTag";
import { roomStatusConfig, fallbackStatusConfig } from "@/lib/room-status";
import type { RoomDetail } from "@/lib/api/rooms";

type RoomHeaderCardProps = {
  room: Pick<
    RoomDetail,
    "game" | "title" | "description" | "playStyleTags" | "createdAt" | "status"
  >;
};

export function RoomHeaderCard({ room }: RoomHeaderCardProps) {
  const status =
    roomStatusConfig[room.status as keyof typeof roomStatusConfig] ??
    fallbackStatusConfig;

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: "var(--bg-card)" }}
    >
      {/* Game cover header */}
      <div
        className="relative h-32 flex items-end px-4 pb-3 sm:px-6 sm:pb-4 overflow-hidden"
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
                style={{
                  backgroundColor: status.bg,
                  color: status.color,
                  border: `1px solid ${status.border}`,
                }}
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
      <div className="px-4 py-4 sm:px-6 sm:py-5">
        <h1 className="text-lg sm:text-xl font-bold" style={{ color: "var(--text-primary)" }}>
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
  );
}
