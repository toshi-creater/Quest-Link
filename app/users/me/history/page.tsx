import { Suspense } from "react";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { HistoryListSkeleton } from "@/components/ui/skeletons/HistoryListSkeleton";
import { HistoryList } from "./HistoryList";

export default async function HistoryPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  return (
    <div className="mx-auto max-w-3xl px-4 py-4 sm:py-8 sm:px-6">
      <BackButton href={"/users/me"} />

      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          参加履歴
        </h1>
      </div>

      <Suspense fallback={<HistoryListSkeleton />}>
        <HistoryList userId={userId} />
      </Suspense>
    </div>
  );
}
