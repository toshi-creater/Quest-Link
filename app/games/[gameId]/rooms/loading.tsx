function RoomCardSkeleton() {
  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="h-20 animate-shimmer" />
      <div className="px-4 pb-4 pt-2 space-y-3">
        <div className="h-4 w-3/4 rounded animate-shimmer" />
        <div className="min-h-[52px] space-y-2">
          <div className="h-3 w-full rounded animate-shimmer" />
          <div className="flex gap-1">
            <div className="h-5 w-14 rounded-full animate-shimmer" />
            <div className="h-5 w-12 rounded-full animate-shimmer" />
          </div>
        </div>
        <div
          className="flex items-center gap-2 border-t pt-3"
          style={{ borderColor: "var(--border)" }}
        >
          <div className="h-6 w-6 rounded-full animate-shimmer shrink-0" />
          <div className="h-3 w-20 rounded animate-shimmer" />
          <div className="ml-auto h-4 w-16 rounded animate-shimmer" />
        </div>
      </div>
    </div>
  );
}

export default function GameRoomsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* ゲームヘッダー */}
      <div className="mb-8 flex items-center gap-5">
        <div className="h-24 w-16 shrink-0 rounded-xl animate-shimmer" />
        <div className="space-y-2">
          <div className="h-3 w-24 rounded animate-shimmer" />
          <div className="h-7 w-48 rounded-lg animate-shimmer" />
        </div>
      </div>
      {/* フィルターバー */}
      <div className="mb-4 h-11 rounded-xl animate-shimmer" />
      <div className="mb-6 h-9 w-28 rounded-xl animate-shimmer" />
      {/* ルームグリッド */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <RoomCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
