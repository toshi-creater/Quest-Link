export function HistoryListSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ backgroundColor: "var(--bg-card)" }}
    >
      <ul>
        {Array.from({ length: 5 }).map((_, i) => (
          <li
            key={i}
            className="flex items-center gap-3 px-3 py-3 sm:gap-4 sm:px-5 sm:py-4"
          >
            <div className="h-14 w-10 shrink-0 rounded-lg animate-shimmer" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="h-3 w-20 rounded animate-shimmer" />
              <div className="h-4 w-3/4 rounded animate-shimmer" />
            </div>
            <div className="shrink-0 space-y-1 text-right">
              <div className="h-3 w-16 rounded animate-shimmer" />
              <div className="h-3 w-10 rounded animate-shimmer" />
            </div>
            <div className="h-5 w-10 rounded-full animate-shimmer shrink-0" />
          </li>
        ))}
      </ul>
    </div>
  );
}
