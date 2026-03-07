"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Gamepad2 } from "lucide-react";
import { MOCK_GAMES, MOCK_ROOMS } from "@/lib/mock-data";

const waitingCountByGame = MOCK_ROOMS.reduce<Record<string, number>>(
  (acc, room) => {
    if (room.status === "waiting") {
      acc[room.game.id] = (acc[room.game.id] ?? 0) + 1;
    }
    return acc;
  },
  {},
);

export default function GamesPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  const filteredGames = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return MOCK_GAMES;
    return MOCK_GAMES.filter((g) => g.name.toLowerCase().includes(q));
  }, [query]);

  const handleImgError = (gameId: string) => {
    setImgErrors((prev) => new Set(prev).add(gameId));
  };

  return (
    <main className="mx-auto max-w-screen-xl px-4 py-10 pb-24 md:pb-10">
      {/* Page header */}
      <div className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          ゲームを選んで仲間を見つけよう
        </h1>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          プレイしたいゲームを選択して、部屋を探そう
        </p>
      </div>

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
          全{MOCK_GAMES.length}件
        </span>
      </div>

      {/* Game grid */}
      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {filteredGames.map((game) => {
            const roomCount = waitingCountByGame[game.id] ?? 0;
            const hasError = imgErrors.has(game.id);

            return (
              <button
                key={game.id}
                onClick={() => router.push(`/games/${game.id}/rooms`)}
                className="group text-left"
              >
                {/* Cover image */}
                <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl">
                  {!hasError && game.coverUrl ? (
                    <img
                      src={game.coverUrl}
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
    </main>
  );
}
