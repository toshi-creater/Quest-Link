"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { GameController } from "@phosphor-icons/react";
import type { GameResult } from "@/lib/games";

type Props = {
  games: GameResult[];
};

export function HomeGameGrid({ games }: Props) {
  const router = useRouter();
  const [imgErrors, setImgErrors] = useState<Set<string>>(new Set());

  const handleImgError = (gameId: string) => {
    setImgErrors((prev) => new Set(prev).add(gameId));
  };

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
      {games.map((game, index) => {
        const hasError = imgErrors.has(game.id);
        return (
          <button
            key={game.id}
            onClick={() => router.push(`/games/${game.id}/rooms`)}
            className="group text-left animate-fade-in-up"
            style={{ animationDelay: `${Math.min(index, 11) * 50}ms` }}
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl">
              {!hasError && game.coverImageUrl ? (
                <Image
                  src={game.coverImageUrl}
                  alt={game.name}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 17vw"
                  onError={() => handleImgError(game.id)}
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{ background: "var(--bg-card-hover)" }}
                >
                  <GameController className="h-8 w-8 opacity-40" style={{ color: "var(--accent)" }} />
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
  );
}
