import Image from "next/image";
import { notFound } from "next/navigation";
import { getGameById } from "@/lib/games";
import { RoomsFilter } from "@/app/rooms/RoomsFilter";

type Props = {
  params: Promise<{ gameId: string }>;
};

export default async function GameRoomsPage({ params }: Props) {
  const { gameId } = await params;
  const game = await getGameById(gameId);
  if (!game) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-center gap-5">
        <div className="h-24 w-16 shrink-0 overflow-hidden rounded-xl">
          {game.coverImageUrl ? (
            <Image
              src={game.coverImageUrl}
              alt={game.name}
              width={64}
              height={96}
              className="h-full w-full object-cover"
            />
          ) : (
            <div
              className="flex h-full items-center justify-center rounded-xl"
              style={{ backgroundColor: "var(--bg-card-hover)" }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 opacity-40"
                style={{ color: "var(--accent)" }}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="6" y1="12" x2="18" y2="12" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <rect x="2" y="6" width="20" height="12" rx="2" />
              </svg>
            </div>
          )}
        </div>

        <div>
          <p
            className="mb-1 text-xs font-medium uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            ゲーム別部屋一覧
          </p>
          <h1 className="md:text-2xl text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            {game.name}
          </h1>
        </div>
      </div>

      <RoomsFilter gameId={gameId} />
    </div>
  );
}
