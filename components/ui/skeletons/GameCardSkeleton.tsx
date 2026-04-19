export function GameCardSkeleton() {
  return (
    <div className="space-y-1.5">
      <div className="aspect-[3/4] w-full rounded-xl animate-shimmer" />
      <div className="h-3.5 w-full rounded animate-shimmer" />
    </div>
  );
}
