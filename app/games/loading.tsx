export default function GamesLoading() {
  return (
    <main className="mx-auto max-w-screen-xl px-4 md:py-10 py-5 pb-24 md:pb-10">
      <div className="mb-4 sm:mb-8 md:text-left text-center">
        <div className="h-7 w-32 rounded-lg animate-shimmer inline-block" />
      </div>
      <div className="mb-6 flex items-center gap-3">
        <div className="h-10 flex-1 rounded-xl animate-shimmer" />
        <div className="h-4 w-12 rounded animate-shimmer" />
      </div>
      <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="aspect-[3/4] w-full rounded-xl animate-shimmer" />
            <div className="h-3.5 w-full rounded animate-shimmer" />
            <div className="h-3 w-2/3 rounded animate-shimmer" />
          </div>
        ))}
      </div>
    </main>
  );
}
