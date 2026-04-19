import { GamesGridSkeleton } from "@/components/ui/skeletons/GamesGridSkeleton";

export default function NewRoomLoading() {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-4 sm:py-8 sm:px-6">
      <div className="mb-4 sm:mb-6 md:text-left text-center">
        <div className="h-7 w-24 rounded-lg animate-shimmer inline-block" />
      </div>

      {/* ステップインジケーター */}
      <div className="flex items-center justify-center mb-6">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-full animate-shimmer shrink-0" />
          <div className="h-4 w-16 rounded animate-shimmer" />
          <div className="h-px w-12 mx-1 animate-shimmer" />
          <div className="h-6 w-6 rounded-full animate-shimmer shrink-0" />
          <div className="h-4 w-16 rounded animate-shimmer" />
        </div>
      </div>

      <GamesGridSkeleton />
    </div>
  );
}
