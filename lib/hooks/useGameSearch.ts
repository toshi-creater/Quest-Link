"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { type Game } from "@/lib/mock-data";

type Options = {
  limit?: number;
  fetchOnEmpty?: boolean;
};

export function useGameSearch(
  query: string,
  { limit = 10, fetchOnEmpty = true }: Options = {},
) {
  const [results, setResults] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [isPopular, setIsPopular] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const search = useCallback(
    async (q: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setLoading(true);
      try {
        const url =
          q.trim().length === 0
            ? `/api/v1/games/search?limit=${limit}`
            : `/api/v1/games/search?q=${encodeURIComponent(q)}&limit=${limit}`;
        const res = await fetch(url, { signal: controller.signal });
        if (!res.ok) {
          setResults([]);
          return;
        }
        const json = (await res.json()) as { data: Game[] };
        setIsPopular(q.trim().length === 0);
        setResults(json.data);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [limit],
  );

  useEffect(() => {
    if (!fetchOnEmpty && query.trim().length === 0) {
      setResults([]);
      setIsPopular(false);
      setLoading(false);
      return;
    }
    const delay = query.trim().length === 0 ? 0 : 300;
    const timer = setTimeout(() => search(query), delay);
    return () => clearTimeout(timer);
  }, [query, search, fetchOnEmpty]);

  return { results, loading, isPopular };
}
