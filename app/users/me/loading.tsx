export default function MyProfileLoading() {
  return (
    <div className="mx-auto max-w-3xl pb-8 sm:mt-6 sm:rounded-2xl sm:border sm:border-[var(--border)] sm:bg-[var(--bg-card)]">
      <div
        className="relative h-[200px] rounded-b-3xl sm:rounded-none sm:border-b sm:border-[var(--border)]"
        style={{ backgroundColor: "var(--bg-card)" }}
      >
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
          <div className="h-20 w-20 rounded-full animate-shimmer" />
        </div>
      </div>
      <div className="pt-14 pb-4 text-center space-y-3 px-4 sm:px-6">
        <div className="h-7 w-40 rounded animate-shimmer mx-auto" />
        <div className="h-4 w-28 rounded animate-shimmer mx-auto" />
        <div className="h-4 w-64 rounded animate-shimmer mx-auto" />
      </div>
      <div className="flex justify-center gap-12 px-4 sm:px-6 py-6">
        <div className="h-12 w-20 rounded animate-shimmer" />
        <div className="h-12 w-20 rounded animate-shimmer" />
      </div>
      <div className="mx-4 sm:mx-6 space-y-4">
        <div className="h-36 rounded-2xl animate-shimmer" />
        <div className="h-24 rounded-2xl animate-shimmer" />
      </div>
    </div>
  );
}
