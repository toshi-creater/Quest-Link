export default function CurrentRoomChatLoading() {
  return (
    <div
      className="fixed inset-x-0 top-0 bottom-[calc(60px_+_env(safe-area-inset-bottom))] z-30 flex flex-col md:top-16 md:bottom-0 md:flex-row"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      {/* Desktop sidebar */}
      <aside
        className="hidden w-64 shrink-0 flex-col border-r md:flex"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <div className="border-b p-4 space-y-2" style={{ borderColor: "var(--border)" }}>
          <div className="h-8 w-8 rounded-lg animate-shimmer mb-3" />
          <div className="h-4 w-40 rounded animate-shimmer" />
          <div className="h-3 w-28 rounded animate-shimmer" />
        </div>
        <div className="flex-1 p-4">
          <div className="h-3 w-24 rounded animate-shimmer mb-3" />
          <ul className="space-y-2.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full animate-shimmer shrink-0" />
                <div className="space-y-1 flex-1">
                  <div className="h-3 w-20 rounded animate-shimmer" />
                  <div className="h-2.5 w-16 rounded animate-shimmer" />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Chat area */}
      <div className="flex flex-1 flex-col min-w-0 min-h-0">
        <div
          className="flex items-center gap-3 border-b px-4 py-3 md:hidden"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <div className="h-8 w-8 rounded-lg animate-shimmer shrink-0" />
          <div className="space-y-1 flex-1">
            <div className="h-3.5 w-32 rounded animate-shimmer" />
            <div className="h-3 w-16 rounded animate-shimmer" />
          </div>
        </div>
        <div className="flex-1 overflow-hidden px-4 py-3 space-y-4">
          <div className="flex justify-center">
            <div className="h-5 w-40 rounded-full animate-shimmer" />
          </div>
          <div className="flex items-end gap-2">
            <div className="h-7 w-7 rounded-full animate-shimmer shrink-0" />
            <div className="space-y-1">
              <div className="h-3 w-16 rounded animate-shimmer" />
              <div className="h-10 w-48 rounded-2xl rounded-bl-none animate-shimmer" />
            </div>
          </div>
          <div className="flex items-end gap-2 justify-end">
            <div className="h-10 w-56 rounded-2xl rounded-br-none animate-shimmer" />
          </div>
          <div className="flex items-end gap-2">
            <div className="h-7 w-7 rounded-full animate-shimmer shrink-0" />
            <div className="space-y-1">
              <div className="h-3 w-20 rounded animate-shimmer" />
              <div className="h-16 w-40 rounded-2xl rounded-bl-none animate-shimmer" />
            </div>
          </div>
        </div>
        <div
          className="border-t p-3 flex items-end gap-2"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <div className="flex-1 h-10 rounded-xl animate-shimmer" />
          <div className="h-10 w-10 rounded-xl animate-shimmer shrink-0" />
        </div>
      </div>
    </div>
  );
}
