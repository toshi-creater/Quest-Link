"use client";

import Image from "next/image";
import { GameController } from "@phosphor-icons/react";

type Game = {
  id: string;
  igdbId: number;
  name: string;
  coverImageUrl: string | null;
};

type GameScrollListProps = {
  games: Game[];
};

export function GameScrollList({ games }: GameScrollListProps) {
  return (
    <div className="mt-4">
      <h2
        className="mb-3 px-4 sm:px-6 text-sm font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-muted)" }}
      >
        プレイしているゲーム
      </h2>
      {games.length > 0 ? (
        <div className="flex gap-3 overflow-x-auto px-4 sm:px-6 pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden">
          {games.map((game) => (
            <div key={game.id} className="flex shrink-0 flex-col items-center gap-2">
              <div
                className="relative h-36 w-28 overflow-hidden rounded-lg"
                style={{
                  backgroundColor: "rgba(124,58,237,0.15)",
                  border: "1px solid rgba(124,58,237,0.2)",
                }}
              >
                {game.coverImageUrl ? (
                  <Image
                    src={game.coverImageUrl}
                    alt={game.name}
                    fill
                    className="object-cover"
                    sizes="112px"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <GameController className="h-6 w-6" style={{ color: "var(--accent-light)" }} />
                  </div>
                )}
              </div>
              <span
                className="w-28 truncate text-center text-xs"
                style={{ color: "var(--text-secondary)" }}
              >
                {game.name}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="px-4 sm:px-6 text-sm" style={{ color: "var(--text-muted)" }}>
          ゲームが設定されていません
        </p>
      )}
    </div>
  );
}
