"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { fetchRooms, type RoomSummary } from "@/lib/api/rooms";
import { RoomCard } from "@/components/ui/RoomCard";
import { TagFilterToggle } from "@/components/ui/TagFilterToggle";
import { TagFilterPanel } from "@/components/ui/TagFilterPanel";
import { ActiveFilterBar } from "@/components/ui/ActiveFilterBar";

type Tag = {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  category: { id: string; name: string; slug: string } | null;
};
type TagsResponse = { data: Tag[] };

async function fetchTags(): Promise<Tag[]> {
  const res = await fetch("/api/v1/play-style-tags", { credentials: "include" });
  if (!res.ok) return [];
  const json = (await res.json()) as TagsResponse;
  return json.data;
}

export function RoomsFilter({ gameId }: { gameId?: string }) {
  const [query, setQuery] = useState("");
  const [appliedTags, setAppliedTags] = useState<string[]>([]);
  const [pendingTags, setPendingTags] = useState<string[]>([]);
  const [panelOpen, setPanelOpen] = useState(false);

  const { data: tagsData = [] } = useQuery({
    queryKey: ["play-style-tags"],
    queryFn: fetchTags,
  });

  const tagSlugsParam = appliedTags.length > 0 ? appliedTags.join(",") : undefined;

  const {
    data: roomsData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["rooms", { gameId, tagSlugs: tagSlugsParam }],
    queryFn: () => fetchRooms({ status: "waiting", gameId, tagSlugs: tagSlugsParam }),
  });

  const allRooms: RoomSummary[] = roomsData?.data ?? [];

  const filtered = allRooms.filter((room) => {
    if (query === "") return true;
    return (
      room.game.name.toLowerCase().includes(query.toLowerCase()) ||
      room.title.toLowerCase().includes(query.toLowerCase())
    );
  });

  const togglePendingTag = (slug: string) => {
    setPendingTags((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  const handlePanelToggle = () => {
    if (!panelOpen) {
      setPendingTags(appliedTags);
    }
    setPanelOpen((prev) => !prev);
  };

  const handleApply = () => {
    setAppliedTags(pendingTags);
    setPanelOpen(false);
  };

  return (
    <>
      {/* MagnifyingGlass */}
      <div
        className="relative mb-4 flex items-center rounded-xl border px-4 py-2.5 focus-within:border-[var(--accent)] transition-colors"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <MagnifyingGlass className="mr-3 h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
        <input
          type="text"
          placeholder="ゲームタイトル・部屋名で検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
          style={{ color: "var(--text-primary)" }}
        />
      </div>

      {/* Tag filters */}
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <TagFilterToggle
            selectedCount={appliedTags.length}
            panelOpen={panelOpen}
            onPanelToggle={handlePanelToggle}
          />
          {appliedTags.length > 0 && (
            <button
              onClick={() => setAppliedTags([])}
              className="shrink-0 text-xs transition-opacity hover:opacity-70"
              style={{ color: "var(--text-muted)" }}
            >
              すべてクリア
            </button>
          )}
        </div>
        <TagFilterPanel
          tags={tagsData}
          selectedTags={pendingTags}
          onToggle={togglePendingTag}
          open={panelOpen}
          onApply={handleApply}
        />
        <div className="mt-2 min-w-0">
          <ActiveFilterBar
            selectedTags={appliedTags}
            allTags={tagsData}
            onRemove={(slug) => setAppliedTags((prev) => prev.filter((s) => s !== slug))}
          />
        </div>
      </div>

      {/* Room grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border overflow-hidden animate-fade-in"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)", animationDelay: `${i * 60}ms` }}
            >
              <div className="h-32 animate-shimmer" />
              <div className="p-4 space-y-3">
                <div className="h-5 w-3/4 rounded-md animate-shimmer" />
                <div className="h-3 w-1/2 rounded-md animate-shimmer" />
                <div className="flex gap-2 mt-2">
                  <div className="h-5 w-14 rounded-full animate-shimmer" />
                  <div className="h-5 w-12 rounded-full animate-shimmer" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium" style={{ color: "var(--text-secondary)" }}>
            部屋の取得に失敗しました
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            ページを再読み込みしてください
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium" style={{ color: "var(--text-secondary)" }}>
            部屋が見つかりませんでした
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            検索条件を変えてみてください
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          {filtered.map((room, index) => (
            <div key={room.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 60}ms` }}>
              <RoomCard room={room} />
            </div>
          ))}
        </div>
      )}
    </>
  );
}
