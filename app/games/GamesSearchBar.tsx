"use client";

import { MagnifyingGlass } from "@phosphor-icons/react";
import { useGamesQuery } from "./GamesQueryContext";

export function GamesSearchBar() {
  const { query, setQuery } = useGamesQuery();
  return (
    <div className="mb-6 relative flex-1">
      <MagnifyingGlass
        className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2"
        style={{ color: "var(--text-secondary)" }}
      />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="ゲームを検索..."
        className="w-full rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none"
        style={{
          background: "var(--bg-card)",
          color: "var(--text-primary)",
        }}
      />
    </div>
  );
}
