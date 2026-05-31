"use client";

import Link from "next/link";
import { GameCoverImage } from "@/components/ui/GameCoverImage";
import type { Game } from "@/lib/mock-data";

type Props = { games: Game[] };

export function GameMatchList({ games }: Props) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        ゲーム
      </h2>
      {/* Mobile: 3カラム分の幅で横スクロール / sm+: 6カラムグリッド */}
      <div className="flex gap-3 overflow-x-auto pb-2 sm:grid sm:grid-cols-6 sm:overflow-visible sm:pb-0">
        {games.map((game) => (
          <Link
            key={game.id}
            href={`/games/${game.id}/rooms`}
            className="group shrink-0 w-[calc((100vw-3.5rem)/3)] text-left sm:w-auto sm:shrink"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl">
              <GameCoverImage
                coverImageUrl={game.coverImageUrl}
                name={game.name}
                className="transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-transparent p-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <span className="text-xs font-semibold text-white">探す →</span>
              </div>
            </div>
            <p className="mt-1.5 truncate text-xs font-medium" style={{ color: "var(--text-primary)" }}>
              {game.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
