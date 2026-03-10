"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Gamepad2 } from "lucide-react";
import type { GameResult } from "@/lib/games";

type Props = {
  games: GameResult[];
  roomCounts: Record<string, number>;
};

export function GamesGrid({ games, roomCounts }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  const filteredGames = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return games;
    return games.filter((g) => g.name.toLowerCase().includes(q));
  }, [query, games]);

  const handleImgError = (gameId: string) => {
    setImgErrors((prev) => new Set(prev).add(gameId));
  };

  return (
    <>
      {/* Search bar */}
      <div className="mb-6 flex items-center gap-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
            style={{ color: "var(--text-secondary)" }}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ゲームを検索..."
            className="w-full rounded-xl border py-2.5 pl-9 pr-4 text-sm outline-none transition-colors focus:border-[var(--primary)]"
            style={{
              background: "var(--bg-card)",
              borderColor: "rgba(255,255,255,0.08)",
              color: "var(--text-primary)",
            }}
          />
        </div>
        <span className="shrink-0 text-sm" style={{ color: "var(--text-secondary)" }}>
          全{games.length}件
        </span>
      </div>

      {/* Game grid */}
      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredGames.map((game) => {
            const roomCount = roomCounts[game.id] ?? 0;
            const hasError = imgErrors.has(game.id);

            return (
              <button
                key={game.id}
                onClick={() => router.push(`/games/${game.id}/rooms`)}
                className="group text-left"
              >
                {/* Cover image */}
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl">
                  {!hasError && game.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={game.coverImageUrl}
                      alt={game.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={() => handleImgError(game.id)}
                    />
                  ) : (
                    <div
                      className="flex h-full w-full items-center justify-center"
                      style={{ background: "var(--bg-elevated)" }}
                    >
                      <Gamepad2 className="h-10 w-10 opacity-40" style={{ color: "var(--primary)" }} />
                    </div>
                  )}

                  {/* Hover overlay */}
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <span className="text-xs font-semibold text-white">部屋を探す →</span>
                  </div>
                </div>

                {/* Card text */}
                <div className="mt-2 space-y-0.5">
                  <p className="truncate text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                    {game.name}
                  </p>
                  <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
                    {roomCount > 0 ? `${roomCount} 部屋募集中` : "募集なし"}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            &ldquo;{query}&rdquo; に一致するゲームが見つかりません
          </p>
        </div>
      )}
    </>
  );
}
