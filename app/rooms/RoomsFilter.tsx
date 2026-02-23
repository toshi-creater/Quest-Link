"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import clsx from "clsx";
import type { PlayStyleTag, Room } from "@/lib/mock-data";
import { RoomCard } from "@/components/ui/RoomCard";

type Props = {
  tags: PlayStyleTag[];
  rooms: Room[];
};

export function RoomsFilter({ tags, rooms }: Props) {
  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filtered = rooms.filter((room) => {
    if (room.status === "closed") return false;
    const matchesQuery =
      query === "" ||
      room.game.name.toLowerCase().includes(query.toLowerCase()) ||
      room.title.toLowerCase().includes(query.toLowerCase());
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.every((slug) => room.playStyleTags.some((t) => t.slug === slug));
    return matchesQuery && matchesTags;
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
        className="relative mb-4 flex items-center rounded-xl border px-4 py-2.5 focus-within:border-purple-500 transition-colors"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <Search className="mr-3 h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
        <input
          type="text"
          placeholder="ゲームタイトル・部屋名で検索..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full bg-transparent text-sm outline-none placeholder:text-gray-600"
          style={{ color: "var(--text-primary)" }}
        />
      </div>

      {/* Tag filters */}
      <div className="mb-6 flex flex-wrap gap-2">
        {tags.map((tag) => {
          const active = selectedTags.includes(tag.slug);
          return (
            <button
              key={tag.id}
              onClick={() => toggleTag(tag.slug)}
              className={clsx(
                "rounded-full px-3 py-1.5 text-xs font-medium transition-all"
              )}
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
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium" style={{ color: "var(--text-secondary)" }}>
            部屋が見つかりませんでした
          </p>
          <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
            検索条件を変えてみてください
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      )}
    </>
  );
}
