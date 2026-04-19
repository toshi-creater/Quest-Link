import { Suspense } from "react";
import { GamesGridSkeleton } from "@/components/ui/skeletons/GamesGridSkeleton";
import { GamesQueryProvider } from "./GamesQueryContext";
import { GamesSearchBar } from "./GamesSearchBar";
import { GamesGridServer } from "./GamesGridServer";

export default function GamesPage() {
  return (
    <GamesQueryProvider>
      <main className="mx-auto max-w-screen-xl px-4 md:py-10 py-5 pb-24 md:pb-10">
        <div className="mb-4 sm:mb-8 md:text-left text-center">
          <h1 className="text-lg sm:text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
            ゲームを選択
          </h1>
        </div>

        {/* 検索バーはデータ不要なので Suspense の外で即時表示 */}
        <GamesSearchBar />

        <Suspense fallback={<GamesGridSkeleton />}>
          <GamesGridServer />
        </Suspense>
      </main>
    </GamesQueryProvider>
  );
}
