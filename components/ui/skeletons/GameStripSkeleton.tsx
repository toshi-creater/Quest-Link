import { GameCardSkeleton } from "./GameCardSkeleton";

type Props = { count?: number };

export function GameStripSkeleton({ count = 6 }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
      {Array.from({ length: count }).map((_, i) => (
        <GameCardSkeleton key={i} />
      ))}
    </div>
  );
}
