import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { MobileHomeHeader } from "@/components/ui/MobileHomeHeader";
import { SearchResults } from "./SearchResults";

type Props = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: Props) {
  const { q } = await searchParams;

  const session = await auth();
  if (!session?.user?.id) {
    const callbackUrl = q?.trim() ? `/search?q=${encodeURIComponent(q.trim())}` : "/search";
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  }

  if (!q?.trim()) {
    return (
      <>
        <MobileHomeHeader />
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <p className="text-center py-12" style={{ color: "var(--text-secondary)" }}>
            検索キーワードを入力してください
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <MobileHomeHeader />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>
            「{q.trim()}」の検索結果
          </h1>
        </div>
        <SearchResults key={q.trim()} q={q.trim()} />
      </div>
    </>
  );
}
