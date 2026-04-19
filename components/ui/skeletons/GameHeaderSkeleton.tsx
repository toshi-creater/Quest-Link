export function GameHeaderSkeleton() {
  return (
    <div className="mb-8 flex items-center gap-5">
      <div className="h-24 w-16 shrink-0 rounded-xl animate-shimmer" />
      <div className="space-y-2">
        <div className="h-3 w-24 rounded animate-shimmer" />
        <div className="h-7 w-48 rounded-lg animate-shimmer" />
      </div>
    </div>
  );
}
