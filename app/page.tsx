"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Gamepad2, ChevronRight } from "lucide-react";
import { MOCK_GAMES, MOCK_ROOMS } from "@/lib/mock-data";
import { RoomCard } from "@/components/ui/RoomCard";
import { type RoomSummary } from "@/lib/api/rooms";

const FEATURED_GAMES = MOCK_GAMES.slice(0, 6);
const WAITING_ROOMS = MOCK_ROOMS.filter((r) => r.status === "waiting");

export default function HomePage() {
  const router = useRouter();
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  const handleImgError = (gameId: string) => {
    setImgErrors((prev) => new Set(prev).add(gameId));
  };

  return (
    <main className="mx-auto max-w-screen-xl px-4 py-10 pb-24 md:pb-10 space-y-12">
      {/* ── おすすめゲーム ── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            おすすめゲーム
          </h2>
          <Link
            href="/games"
            className="flex items-center gap-1 text-sm transition-colors hover:text-white"
            style={{ color: "var(--accent-light)" }}
          >
            すべて見る
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {FEATURED_GAMES.map((game) => {
            const hasError = imgErrors.has(game.id);
            return (
              <button
                key={game.id}
                onClick={() => router.push(`/games/${game.id}/rooms`)}
                className="group text-left"
              >
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
                      <Gamepad2 className="h-8 w-8 opacity-40" style={{ color: "var(--primary)" }} />
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                    <span className="text-xs font-semibold text-white">探す →</span>
                  </div>
                </div>
                <p className="mt-1.5 truncate text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                  {game.name}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── 募集中の部屋 ── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            募集中の部屋
          </h2>
          <Link
            href="/games"
            className="flex items-center gap-1 text-sm transition-colors hover:text-white"
            style={{ color: "var(--accent-light)" }}
          >
            ゲームから探す
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WAITING_ROOMS.map((room) => (
            <RoomCard
              key={room.id}
              room={{ ...room, host: { ...room.host, avgRating: room.host.avgRating ?? 0 } } as RoomSummary}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
