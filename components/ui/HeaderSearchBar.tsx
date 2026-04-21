"use client";

import { useState, useRef, useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { GameCoverImage } from "@/components/ui/GameCoverImage";
import { useGameSearch } from "@/lib/hooks/useGameSearch";

export function HeaderSearchBar() {
  const [query, setQuery] = useState("");
  const [dismissed, setDismissed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const prefix = useId();
  const listboxId = `${prefix}-listbox`;

  const { results, loading } = useGameSearch(query, {
    limit: 8,
    fetchOnEmpty: false,
  });

  const hasQuery = query.trim().length > 0;
  const isOpen = hasQuery && !dismissed;
  // total options: 1 search item + N game items
  const totalItems = 1 + results.length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDismissed(true);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setDismissed(false);
    setActiveIndex(-1);
  };

  const navigate = (index: number) => {
    if (index === 0 || index === -1) {
      if (!hasQuery) return;
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
    } else if (results[index - 1]) {
      router.push(`/games/${results[index - 1].id}/rooms`);
    }
    setDismissed(true);
    setActiveIndex(-1);
    setQuery("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;

    if (e.key === "Escape") {
      setDismissed(true);
      setActiveIndex(-1);
      return;
    }

    if (!isOpen) {
      if (e.key === "Enter") navigate(-1);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < totalItems - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : totalItems - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      navigate(activeIndex);
    }
  };

  const getOptionId = (index: number) => `${prefix}-option-${index}`;
  const activeDescendant =
    activeIndex >= 0 ? getOptionId(activeIndex) : undefined;

  return (
    <div ref={containerRef} className="relative w-full max-w-lg">
      <MagnifyingGlass
        className="absolute left-2 top-1/2 -translate-y-1/2"
        size={24}
        color="var(--text-secondary)"
      />
      <input
        type="text"
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-autocomplete="list"
        aria-controls={listboxId}
        aria-activedescendant={activeDescendant}
        value={query}
        onChange={handleQueryChange}
        onKeyDown={handleKeyDown}
        placeholder="ゲーム or 部屋を検索..."
        aria-label="ゲーム or 部屋を検索"
        maxLength={100}
        className="w-full rounded-xl border py-2 pl-9 pr-4 text-sm outline-none transition-colors focus:border-[var(--accent)]"
        style={{
          background: "var(--bg-card)",
          borderColor: "var(--border)",
          color: "var(--text-primary)",
        }}
      />

      {isOpen && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1.5 w-full overflow-hidden rounded-xl border shadow-2xl animate-fade-in-up"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border)",
            boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
            animationDuration: "150ms",
          }}
        >
          {/* Search item */}
          <li
            id={getOptionId(0)}
            role="option"
            aria-selected={activeIndex === 0}
            onClick={() => navigate(0)}
            className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm transition-colors"
            style={
              activeIndex === 0
                ? {
                    backgroundColor: "rgba(124,58,237,0.15)",
                    color: "var(--accent-light)",
                  }
                : { color: "var(--text-secondary)" }
            }
          >
            <MagnifyingGlass size={16} />
            <span>「{query.trim()}」を検索</span>
          </li>

          {/* Game results */}
          {loading ? (
            <li
              className="px-4 py-3 text-center text-sm"
              style={{ color: "var(--text-muted)" }}
            >
              検索中...
            </li>
          ) : (
            results.map((game, i) => (
              <li
                key={game.id}
                id={getOptionId(i + 1)}
                role="option"
                aria-selected={activeIndex === i + 1}
                onClick={() => navigate(i + 1)}
                className="flex cursor-pointer items-center gap-3 px-3 py-2.5 text-sm transition-colors hover:bg-white/[0.04]"
                style={
                  activeIndex === i + 1
                    ? {
                        backgroundColor: "rgba(124,58,237,0.15)",
                        color: "var(--accent-light)",
                      }
                    : { color: "var(--text-primary)" }
                }
              >
                <GameCoverImage
                  coverImageUrl={game.coverImageUrl}
                  name={game.name}
                  size="sm"
                />
                <span className="flex-1 truncate">{game.name}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
