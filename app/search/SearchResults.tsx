"use client";

import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchRooms, type RoomsListResponse, type RoomSummary } from "@/lib/api/rooms";
import { RoomCardSkeleton } from "@/components/ui/skeletons/RoomCardSkeleton";
import type { Game } from "@/lib/mock-data";
import { GameMatchList } from "./GameMatchList";
import { RoomMatchList } from "./RoomMatchList";

type Props = { q: string };

function SearchSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <div className="mb-3 h-3 w-16 rounded animate-shimmer" />
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 p-2">
              <div className="h-24 w-18 rounded-lg animate-shimmer" />
              <div className="h-3 w-full rounded animate-shimmer" />
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-3 h-3 w-12 rounded animate-shimmer" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <RoomCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SearchResults({ q }: Props) {
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const gamesQuery = useQuery({
    queryKey: ["search-games", q],
    queryFn: async () => {
      const res = await fetch(`/api/v1/games/search?q=${encodeURIComponent(q)}&limit=6`);
      if (!res.ok) throw new Error("ゲーム検索に失敗しました");
      return res.json() as Promise<{ data: Game[] }>;
    },
    staleTime: 30_000,
  });

  const roomsQuery = useQuery({
    queryKey: ["search-rooms", q, page],
    queryFn: () => fetchRooms({ q, limit: 20, page }),
    staleTime: 30_000,
  });

  // Read all cached pages from the React Query cache to build the accumulated list.
  // roomsQuery.data is included in deps to trigger recomputation when the current
  // page's data arrives, even though it's not used directly in the memo body.
  const allRooms = useMemo(() => {
    const rooms: RoomSummary[] = [];
    for (let p = 1; p <= page; p++) {
      const cached = queryClient.getQueryData<RoomsListResponse>(["search-rooms", q, p]);
      if (cached?.data) rooms.push(...cached.data);
    }
    return rooms;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient, q, page, roomsQuery.data]);

  const totalRooms = roomsQuery.data?.meta.total ?? 0;
  const hasMore = allRooms.length < totalRooms;
  const isInitialLoading =
    gamesQuery.isLoading || (roomsQuery.isLoading && allRooms.length === 0);

  const games = gamesQuery.data?.data ?? [];

  if (isInitialLoading) {
    return <SearchSkeleton />;
  }

  if (games.length === 0 && allRooms.length === 0) {
    return (
      <p className="py-12 text-center" style={{ color: "var(--text-secondary)" }}>
        一致するゲーム・部屋が見つかりません
      </p>
    );
  }

  return (
    <div className="space-y-8">
      {games.length > 0 && <GameMatchList games={games} />}
      {allRooms.length > 0 && (
        <RoomMatchList
          rooms={allRooms}
          hasMore={hasMore}
          isLoadingMore={roomsQuery.isFetching && page > 1}
          onLoadMore={() => setPage((p) => p + 1)}
        />
      )}
    </div>
  );
}
