"use client";

import { useState } from "react";
import { MagnifyingGlass } from "@phosphor-icons/react";

export function HeaderSearchBar() {
  const [query, setQuery] = useState("");

  return (
    <form
      onSubmit={(e) => e.preventDefault()}
      className="relative w-full max-w-lg"
    >
      <MagnifyingGlass
        className="absolute left-2 top-1/2 -translate-y-1/2"
        size={24}
        color="var(--text-secondary)"
      />
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="検索"
        aria-label="検索"
        className="w-full rounded-xl border py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-[var(--accent)]"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border)",
          color: "var(--text-primary)",
        }}
      />
    </form>
  );
}
