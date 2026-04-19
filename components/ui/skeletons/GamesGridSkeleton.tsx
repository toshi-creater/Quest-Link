export function GamesGridSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 24 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="aspect-[3/4] w-full rounded-xl animate-shimmer" />
          <div className="h-3.5 w-full rounded animate-shimmer" />
          <div className="h-3 w-2/3 rounded animate-shimmer" />
        </div>
      ))}
    </div>
  );
}
