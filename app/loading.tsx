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

export default function HomeLoading() {
  return (
    <main className="mx-auto max-w-screen-xl px-4 py-10 pb-24 md:pb-10 space-y-12">
      {/* おすすめゲーム */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-7 w-36 rounded-lg animate-shimmer" />
          <div className="h-5 w-20 rounded animate-shimmer" />
        </div>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="aspect-[3/4] w-full rounded-xl animate-shimmer" />
              <div className="h-3.5 w-full rounded animate-shimmer" />
            </div>
          ))}
        </div>
      </section>

      {/* 募集中の部屋 */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-7 w-36 rounded-lg animate-shimmer" />
          <div className="h-5 w-20 rounded animate-shimmer" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <RoomCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </main>
  );
}
