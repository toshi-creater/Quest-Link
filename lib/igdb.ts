/**
 * IGDB API クライアント
 *
 * - Client Credentials Flow でアクセストークンを取得・メモリキャッシュ
 * - ゲーム検索結果を games テーブルに30日間キャッシュ
 */

import { prisma } from "@/lib/prisma";

// ─── アクセストークンキャッシュ ──────────────────────────────────────────────

type TokenCache = {
  accessToken: string;
  expiresAt: number; // Unix ms
};

let tokenCache: TokenCache | null = null;

async function getAccessToken(): Promise<string> {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) {
    return tokenCache.accessToken;
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("TWITCH_CLIENT_ID or TWITCH_CLIENT_SECRET is not set");
  }

  const res = await fetch(
    `https://id.twitch.tv/oauth2/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=client_credentials`,
    { method: "POST" }
  );

  if (!res.ok) {
    throw new Error(`Failed to get Twitch token: ${res.status}`);
  }

  const json = (await res.json()) as {
    access_token: string;
    expires_in: number;
  };

  tokenCache = {
    accessToken: json.access_token,
    expiresAt: Date.now() + json.expires_in * 1000,
  };

  return tokenCache.accessToken;
}

// ─── IGDB API 呼び出し ────────────────────────────────────────────────────────

type IgdbGame = {
  id: number;
  name: string;
  cover?: { url: string };
  updated_at?: number; // Unix seconds (IGDB snake_case)
};

function buildCoverUrl(url: string): string {
  // IGDB の画像 URL は "//images.igdb.com/..." の形式で返ってくることがある
  const normalized = url.startsWith("//") ? `https:${url}` : url;
  // t_thumb → t_cover_big に差し替え
  return normalized.replace(/t_\w+/, "t_cover_big");
}

async function searchIgdb(query: string, limit: number): Promise<IgdbGame[]> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!clientId) throw new Error("TWITCH_CLIENT_ID is not set");

  const accessToken = await getAccessToken();

  // 同名ゲームの重複を吸収するため、要求件数の3倍を取得してからJS側で絞る
  const fetchLimit = Math.min(limit * 3, 50);

  const body = [
    `search "${query.replace(/"/g, '\\"')}";`,
    `fields id, name, cover.url, updated_at;`,
    `limit ${fetchLimit};`,
    `where version_parent = null & parent_game = null;`,
  ].join(" ");

  const res = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "text/plain",
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`IGDB API error: ${res.status}`);
  }

  const games = (await res.json()) as IgdbGame[];
  return deduplicateByName(games, limit);
}

async function fetchPopularIgdb(limit: number): Promise<IgdbGame[]> {
  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!clientId) throw new Error("TWITCH_CLIENT_ID is not set");

  const accessToken = await getAccessToken();

  const body = [
    `fields id, name, cover.url, updated_at;`,
    `where category = (0,4,8,9) & total_rating_count > 500`,
    `& version_parent = null & parent_game = null & cover != null;`,
    `sort total_rating_count desc;`,
    `limit ${limit};`,
  ].join(" ");

  const res = await fetch("https://api.igdb.com/v4/games", {
    method: "POST",
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "text/plain",
    },
    body,
  });

  if (!res.ok) {
    throw new Error(`IGDB API error: ${res.status}`);
  }

  return (await res.json()) as IgdbGame[];
}

/**
 * 同一名称のゲームが複数ある場合、updated_at が最新の1件のみ残す。
 * IGDB の search は関連度順で返るため、重複除去後に limit 件に切る。
 */
function deduplicateByName(games: IgdbGame[], limit: number): IgdbGame[] {
  const seen = new Map<string, IgdbGame>();

  for (const game of games) {
    const key = game.name.toLowerCase();
    const existing = seen.get(key);
    if (!existing || (game.updated_at ?? 0) > (existing.updated_at ?? 0)) {
      seen.set(key, game);
    }
  }

  return [...seen.values()].slice(0, limit);
}

// ─── キャッシュ戦略 ───────────────────────────────────────────────────────────

const CACHE_TTL_DAYS = 30;
const CACHE_TTL_MS = CACHE_TTL_DAYS * 24 * 60 * 60 * 1000;

export type GameResult = {
  id: string;
  igdbId: number;
  name: string;
  coverUrl: string | null;
};

/**
 * キーワードでゲームを検索する。
 * 1. DB キャッシュを検索し、有効な件数が limit 以上あればそのまま返す
 * 2. 不足する場合は IGDB API を呼び出してキャッシュを補充する
 */
export async function searchGames(
  query: string,
  limit: number
): Promise<GameResult[]> {
  const now = new Date();
  const cacheExpiry = new Date(now.getTime() - CACHE_TTL_MS);

  // DB キャッシュ検索（name の部分一致、キャッシュ有効なもの）
  const cached = await prisma.game.findMany({
    where: {
      name: { contains: query, mode: "insensitive" },
      cachedAt: { gte: cacheExpiry },
    },
    orderBy: { name: "asc" },
    take: limit,
  });

  if (cached.length >= limit) {
    return cached.map(toResult);
  }

  // IGDB API 呼び出し
  let igdbGames: IgdbGame[];
  try {
    igdbGames = await searchIgdb(query, limit);
  } catch {
    // IGDB エラー時はキャッシュ分だけ返す
    if (cached.length > 0) return cached.map(toResult);
    throw new Error("IGDB_ERROR");
  }

  return upsertAndReturn(igdbGames, now);
}

/**
 * 人気ゲームを取得する（IGDB の総評価数上位）。
 * DB キャッシュは使用せず、毎回 IGDB API から取得してキャッシュを更新する。
 */
export async function getPopularGames(limit: number): Promise<GameResult[]> {
  const now = new Date();
  const cacheExpiry = new Date(now.getTime() - CACHE_TTL_MS);

  // DB に有効なキャッシュが十分あればそのまま返す（人気ゲームは変動が少ないため）
  const cached = await prisma.game.findMany({
    where: { cachedAt: { gte: cacheExpiry } },
    orderBy: { cachedAt: "desc" },
    take: limit,
  });

  if (cached.length >= limit) {
    return cached.map(toResult);
  }

  let igdbGames: IgdbGame[];
  try {
    igdbGames = await fetchPopularIgdb(limit);
  } catch {
    if (cached.length > 0) return cached.map(toResult);
    throw new Error("IGDB_ERROR");
  }

  return upsertAndReturn(igdbGames, now);
}

async function upsertAndReturn(
  igdbGames: IgdbGame[],
  now: Date
): Promise<GameResult[]> {
  const results: GameResult[] = [];

  for (const g of igdbGames) {
    const coverUrl = g.cover?.url ? buildCoverUrl(g.cover.url) : null;

    const upserted = await prisma.game.upsert({
      where: { igdbId: g.id },
      create: { igdbId: g.id, name: g.name, coverUrl, cachedAt: now },
      update: { name: g.name, coverUrl, cachedAt: now },
    });

    results.push(toResult(upserted));
  }

  return results;
}

/**
 * DB 内部 UUID でゲームを取得する。
 */
export async function getGameById(id: string): Promise<GameResult | null> {
  const game = await prisma.game.findUnique({ where: { id } });
  return game ? toResult(game) : null;
}

function toResult(game: {
  id: string;
  igdbId: number;
  name: string;
  coverUrl: string | null;
}): GameResult {
  return {
    id: game.id,
    igdbId: game.igdbId,
    name: game.name,
    coverUrl: game.coverUrl,
  };
}
