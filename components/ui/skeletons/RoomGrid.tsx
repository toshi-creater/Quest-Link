import { RoomCardSkeleton } from "./RoomCardSkeleton";

type Props = { count?: number };

export function RoomGrid({ count = 6 }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <RoomCardSkeleton key={i} />
      ))}
    </div>
  );
}
