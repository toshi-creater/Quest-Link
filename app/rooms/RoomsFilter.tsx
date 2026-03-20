"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import clsx from "clsx";
import { fetchRooms, type RoomSummary } from "@/lib/api/rooms";
import { RoomCard } from "@/components/ui/RoomCard";

type Tag = { id: string; name: string; slug: string; displayOrder: number };
type TagsResponse = { data: Tag[] };

async function fetchTags(): Promise<Tag[]> {
  const res = await fetch("/api/v1/play-style-tags", { credentials: "include" });
  if (!res.ok) return [];
  const json = (await res.json()) as TagsResponse;
  return json.data;
}

export function RoomsFilter({ gameId }: { gameId?: string }) {
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const { data: tagsData = [] } = useQuery({
    queryKey: ["play-style-tags"],
    queryFn: fetchTags,
  });

  const tagSlugsParam = selectedTags.length > 0 ? selectedTags.join(",") : undefined;

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

  const toggleTag = (slug: string) => {
    setSelectedTags((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  };

  return (
    <>
      {/* Search */}
      <div
        className="relative mb-4 flex items-center rounded-xl border px-4 py-2.5 focus-within:border-[var(--accent)] transition-colors"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <Search className="mr-3 h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
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
      <div className="mb-6 flex flex-wrap gap-2">
        {tagsData.map((tag) => {
          const active = selectedTags.includes(tag.slug);
          return (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.slug)}
              className={clsx("rounded-full px-3 py-1.5 text-xs font-medium transition-all")}
              style={
                active
                  ? {
                      backgroundColor: "rgba(124,58,237,0.3)",
                      color: "var(--accent-light)",
                      border: "1px solid rgba(124,58,237,0.6)",
                    }
                  : {
                      backgroundColor: "var(--bg-card)",
                      color: "var(--text-secondary)",
                      border: "1px solid var(--border)",
                    }
              }
            >
              {tag.name}
            </button>
          );
        })}
        {selectedTags.length > 0 && (
          <button
            onClick={() => setSelectedTags([])}
            className="rounded-full px-3 py-1.5 text-xs transition-all"
            style={{ color: "var(--text-muted)" }}
          >
            クリア
          </button>
        )}
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
