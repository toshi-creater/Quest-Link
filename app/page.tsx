import { Suspense } from "react";
import Link from "next/link";
import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import { connection } from "next/server";
import { GameStripSkeleton } from "@/components/ui/skeletons/GameStripSkeleton";
import { RoomGrid } from "@/components/ui/skeletons/RoomGrid";
import { MobileHomeHeader } from "@/components/ui/MobileHomeHeader";
import { HomeRecommendedGames } from "./HomeRecommendedGames";
import { HomeRecruitingRooms } from "./HomeRecruitingRooms";

export default async function HomePage() {
  await connection();

  return (
    <>
      <MobileHomeHeader />
      <main className="mx-auto max-w-screen-xl px-4 py-10 pb-24 md:pb-10 space-y-12">
      {/* ── おすすめゲーム ── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            おすすめゲーム
          </h2>
          <Link
            href="/games"
            className="flex items-center gap-1 text-sm transition-colors hover:text-white"
            style={{ color: "var(--accent-light)" }}
          >
            すべて見る
            <CaretRight className="h-4 w-4" />
          </Link>
        </div>

        <Suspense fallback={<GameStripSkeleton count={6} />}>
          <HomeRecommendedGames />
        </Suspense>
      </section>

      {/* ── 募集中の部屋 ── */}
      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            募集中の部屋
          </h2>
          <Link
            href="/rooms"
            className="flex items-center gap-1 text-sm transition-colors hover:text-white"
            style={{ color: "var(--accent-light)" }}
          >
            もっと見る
            <CaretRight className="h-4 w-4" />
          </Link>
        </div>

        <Suspense fallback={<RoomGrid count={6} />}>
          <HomeRecruitingRooms />
        </Suspense>
      </section>
    </main>
    </>
  );
}
