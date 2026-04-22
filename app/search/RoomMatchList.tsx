"use client";

import { RoomCard } from "@/components/ui/RoomCard";
import { RoomCardSkeleton } from "@/components/ui/skeletons/RoomCardSkeleton";
import type { RoomSummary } from "@/lib/api/rooms";

type Props = {
  rooms: RoomSummary[];
  hasMore: boolean;
  isLoadingMore: boolean;
  onLoadMore: () => void;
};

export function RoomMatchList({ rooms, hasMore, isLoadingMore, onLoadMore }: Props) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        部屋
      </h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
        {isLoadingMore && [0, 1, 2].map((i) => <RoomCardSkeleton key={i} />)}
      </div>
      {hasMore && !isLoadingMore && (
        <div className="mt-6 flex justify-center">
          <button
            onClick={onLoadMore}
            className="rounded-lg border px-6 py-2 text-sm font-medium transition-colors hover:bg-[rgba(124,58,237,0.08)]"
            style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
          >
            もっと見る
          </button>
        </div>
      )}
    </section>
  );
}
