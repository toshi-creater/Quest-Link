"use client";

import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";

type GamesQueryContextType = { query: string; setQuery: (q: string) => void };

const GamesQueryContext = createContext<GamesQueryContextType>({ query: "", setQuery: () => {} });

export function GamesQueryProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState("");
  return <GamesQueryContext.Provider value={{ query, setQuery }}>{children}</GamesQueryContext.Provider>;
}

export function useGamesQuery() {
  return useContext(GamesQueryContext);
}
