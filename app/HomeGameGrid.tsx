"use client";

import { useRouter } from "next/navigation";
import type { GameResult } from "@/lib/games";
import { GameCoverImage } from "@/components/ui/GameCoverImage";

type Props = {
  games: GameResult[];
};

export function HomeGameGrid({ games }: Props) {
  const router = useRouter();

  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
      {games.map((game, index) => {
        return (
          <button
            key={game.id}
            onClick={() => router.push(`/games/${game.id}/rooms`)}
            className="group text-left"
          >
            <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl">
              <GameCoverImage
                coverImageUrl={game.coverImageUrl}
                name={game.name}
                priority={index === 0}
                className="transition-transform duration-300 group-hover:scale-105"
              />
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
