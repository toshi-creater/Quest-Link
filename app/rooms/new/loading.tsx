export default function NewRoomLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-4 sm:py-8 sm:px-6">
      <div className="mb-4 sm:mb-6 md:text-left text-center">
        <div className="h-7 w-24 rounded-lg animate-shimmer inline-block" />
      </div>
      <div className="flex flex-col gap-5 sm:gap-6">
        {/* ゲームピッカー */}
        <div className="space-y-1.5">
          <div className="h-4 w-16 rounded animate-shimmer" />
          <div className="h-11 w-full rounded-xl animate-shimmer" />
        </div>
        {/* タイトル */}
        <div className="space-y-1.5">
          <div className="h-4 w-24 rounded animate-shimmer" />
          <div className="h-11 w-full rounded-xl animate-shimmer" />
        </div>
        {/* 最大人数 */}
        <div className="space-y-1.5">
          <div className="h-4 w-16 rounded animate-shimmer" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-10 w-10 rounded-xl animate-shimmer" />
            ))}
          </div>
        </div>
        {/* タグ */}
        <div className="space-y-1.5">
          <div className="h-4 w-32 rounded animate-shimmer" />
          <div className="h-9 w-32 rounded-xl animate-shimmer" />
        </div>
        {/* 説明 */}
        <div className="space-y-1.5">
          <div className="h-4 w-20 rounded animate-shimmer" />
          <div className="h-20 w-full rounded-xl animate-shimmer" />
        </div>
        {/* ボタン */}
        <div className="flex gap-3">
          <div className="h-12 flex-1 rounded-xl animate-shimmer" />
          <div className="h-12 flex-1 rounded-xl animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
