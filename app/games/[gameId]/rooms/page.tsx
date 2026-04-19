import { Suspense } from "react";
import { RoomsFilter } from "@/app/rooms/RoomsFilter";
import { GameHeaderSkeleton } from "@/components/ui/skeletons/GameHeaderSkeleton";
import { GameHeader } from "./GameHeader";

type Props = {
  params: Promise<{ gameId: string }>;
};

export default async function GameRoomsPage({ params }: Props) {
  const { gameId } = await params;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Suspense fallback={<GameHeaderSkeleton />}>
        <GameHeader gameId={gameId} />
      </Suspense>

      <RoomsFilter gameId={gameId} />
    </div>
  );
}
