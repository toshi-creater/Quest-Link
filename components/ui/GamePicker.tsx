"use client";

import { useState, useRef, useEffect, useCallback, memo } from "react";
import Image from "next/image";
import { Search, X, Gamepad2, Check, ChevronDown } from "lucide-react";
import { type Game } from "@/lib/mock-data";
import clsx from "clsx";

// ─── ゲームカバー画像 ─────────────────────────────────────────────────────────

type GameCoverProps = {
  game: Game;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const coverSizes = {
  sm: "h-10 w-8",
  md: "h-14 w-11",
  lg: "h-24 w-18",
};

export const GameCover = memo(function GameCover({ game, size = "md", className }: GameCoverProps) {
  const [error, setError] = useState(false);
  const sizeClass = coverSizes[size];

  if (!game.coverImageUrl || error) {
    return (
      <div
        className={clsx(
          "flex shrink-0 items-center justify-center rounded-md",
          sizeClass,
          className
        )}
        style={{ backgroundColor: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.2)" }}
        title={game.name}
      >
        <Gamepad2 className="h-4 w-4" style={{ color: "var(--accent-light)" }} />
      </div>
    );
  }

  return (
    <div className={clsx("relative shrink-0 overflow-hidden rounded-md", sizeClass, className)}>
      <Image
        src={game.coverImageUrl}
        alt={game.name}
        fill
        className="object-cover"
        sizes="64px"
        onError={() => setError(true)}
      />
    </div>
  );
});

// ─── ゲーム検索フック ─────────────────────────────────────────────────────────

function useGameSearch(query: string) {
  const [results, setResults] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPopular, setIsPopular] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(async (q: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      const url =
        q.trim().length === 0
          ? `/api/v1/games/search?limit=10`
          : `/api/v1/games/search?q=${encodeURIComponent(q)}&limit=10`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        setResults([]);
        return;
      }
      const json = (await res.json()) as { data: Game[] };
      setIsPopular(q.trim().length === 0);
      setResults(json.data);
    } catch {
      // AbortError は無視
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const delay = query.trim().length === 0 ? 0 : 300;
    const timer = setTimeout(() => search(query), delay);
    return () => clearTimeout(timer);
  }, [query, search]);

  return { results, loading, isPopular };
}

// ─── ゲーム選択（単体） ────────────────────────────────────────────────────────

type SingleGamePickerProps = {
  value: Game | null;
  onChange: (game: Game | null) => void;
  placeholder?: string;
};

export function SingleGamePicker({
  value,
  onChange,
  placeholder = "ゲームを検索...",
}: SingleGamePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const { results, loading, isPopular } = useGameSearch(query);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-sm transition-all text-left"
        style={
          open
            ? { backgroundColor: "var(--bg-input)", borderColor: "var(--accent)", color: "var(--text-primary)" }
            : { backgroundColor: "var(--bg-input)", borderColor: "var(--border)", color: value ? "var(--text-primary)" : "var(--text-muted)" }
        }
      >
        {value ? (
          <>
            <GameCover game={value} size="sm" />
            <span className="flex-1 truncate font-medium">{value.name}</span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(null); }}
              className="ml-auto shrink-0 rounded p-0.5 transition-colors hover:text-red-400"
              style={{ color: "var(--text-muted)" }}
              aria-label="クリア"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </>
        ) : (
          <>
            <Gamepad2 className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
            <span className="flex-1">{placeholder}</span>
            <ChevronDown
              className={clsx("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")}
              style={{ color: "var(--text-muted)" }}
            />
          </>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 mt-1.5 w-full rounded-xl border shadow-2xl overflow-hidden animate-fade-in-up"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)", boxShadow: "0 16px 48px rgba(0,0,0,0.6)", animationDuration: "150ms" }}
        >
          {/* Search */}
          <div
            className="flex items-center gap-2 border-b px-3 py-2.5"
            style={{ borderColor: "var(--border)" }}
          >
            <Search className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              autoFocus
              placeholder="ゲーム名で検索..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
              style={{ color: "var(--text-primary)" }}
            />
          </div>

          {/* Results */}
          <ul className="max-h-64 overflow-y-auto py-1">
            {loading ? (
              <li className="px-4 py-3 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                検索中...
              </li>
            ) : results.length === 0 ? (
              <li className="px-4 py-3 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                見つかりませんでした
              </li>
            ) : (
              <>
                {isPopular && (
                  <li className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    人気のゲーム
                  </li>
                )}
                {results.map((game) => (
                  <li key={game.id}>
                    <button
                      type="button"
                      onClick={() => { onChange(game); setOpen(false); setQuery(""); }}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left hover:bg-white/[0.04]"
                      style={
                        value?.id === game.id
                          ? { backgroundColor: "rgba(124,58,237,0.15)", color: "var(--accent-light)" }
                          : { color: "var(--text-primary)" }
                      }
                    >
                      <GameCover game={game} size="sm" />
                      <span className="flex-1 truncate">{game.name}</span>
                      {value?.id === game.id && <Check className="h-4 w-4 shrink-0" style={{ color: "var(--accent-light)" }} />}
                    </button>
                  </li>
                ))}
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── ゲーム複数選択（プロフィール用）────────────────────────────────────────

type MultiGamePickerProps = {
  value: Game[];
  onChange: (games: Game[]) => void;
  max?: number;
};

export function MultiGamePicker({ value, onChange, max = 20 }: MultiGamePickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const { results, loading, isPopular } = useGameSearch(query);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (game: Game) => {
    const selected = value.some((g) => g.id === game.id);
    if (selected) {
      onChange(value.filter((g) => g.id !== game.id));
    } else if (value.length < max) {
      onChange([...value, game]);
    }
  };

  return (
    <div ref={ref} className="space-y-3">
      {/* Selected games */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((game) => (
            <div
              key={game.id}
              className="flex items-center gap-2 rounded-xl border pr-2 overflow-hidden"
              style={{ backgroundColor: "rgba(124,58,237,0.1)", borderColor: "rgba(124,58,237,0.3)" }}
            >
              <GameCover game={game} size="sm" className="rounded-l-xl rounded-r-none" />
              <span className="text-xs font-medium" style={{ color: "var(--accent-light)" }}>
                {game.name}
              </span>
              <button
                type="button"
                onClick={() => toggle(game)}
                className="ml-1 rounded transition-colors hover:text-red-400"
                style={{ color: "var(--text-muted)" }}
                aria-label={`${game.name}を削除`}
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add button */}
      {value.length < max && (
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex w-full items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-all"
            style={
              open
                ? { backgroundColor: "var(--bg-input)", borderColor: "var(--accent)", color: "var(--text-primary)" }
                : { backgroundColor: "var(--bg-input)", borderColor: "var(--border)", color: "var(--text-muted)" }
            }
          >
            <Search className="h-4 w-4 shrink-0" />
            <span>ゲームを追加...</span>
            <span className="ml-auto text-xs" style={{ color: "var(--text-muted)" }}>
              {value.length}/{max}
            </span>
          </button>

          {open && (
            <div
              className="absolute z-50 mt-1.5 w-full rounded-xl border shadow-2xl overflow-hidden animate-fade-in-up"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)", boxShadow: "0 16px 48px rgba(0,0,0,0.6)", animationDuration: "150ms" }}
            >
              <div
                className="flex items-center gap-2 border-b px-3 py-2.5"
                style={{ borderColor: "var(--border)" }}
              >
                <Search className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} />
                <input
                  type="text"
                  autoFocus
                  placeholder="ゲーム名で検索..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--text-muted)]"
                  style={{ color: "var(--text-primary)" }}
                />
              </div>

              <ul className="max-h-64 overflow-y-auto py-1">
                {loading ? (
                  <li className="px-4 py-3 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    検索中...
                  </li>
                ) : results.length === 0 ? (
                  <li className="px-4 py-3 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                    見つかりませんでした
                  </li>
                ) : (
                  <>
                    {isPopular && (
                      <li className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                        人気のゲーム
                      </li>
                    )}
                    {results.map((game) => {
                      const isSelected = value.some((g) => g.id === game.id);
                      return (
                        <li key={game.id}>
                          <button
                            type="button"
                            onClick={() => toggle(game)}
                            className="flex w-full items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left hover:bg-white/[0.04]"
                            style={
                              isSelected
                                ? { backgroundColor: "rgba(124,58,237,0.15)", color: "var(--accent-light)" }
                                : { color: "var(--text-primary)" }
                            }
                          >
                            <GameCover game={game} size="sm" />
                            <span className="flex-1 truncate">{game.name}</span>
                            {isSelected && <Check className="h-4 w-4 shrink-0" style={{ color: "var(--accent-light)" }} />}
                          </button>
                        </li>
                      );
                    })}
                  </>
                )}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
