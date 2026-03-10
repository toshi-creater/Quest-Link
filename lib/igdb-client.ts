import { getIgdbAccessToken } from "./igdb-auth";

export type IgdbGame = {
  id: number;
  name: string;
  game_type: number;
  game_modes: number[];
  genres?: { id: number; name: string }[];
  game_localizations?: { id: number; name: string; region: number }[];
  cover?: { image_id: string };
};

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function fetchIgdbWithRetry(body: string, retries = 3): Promise<IgdbGame[]> {
  const clientId = process.env["TWITCH_CLIENT_ID"];
  if (!clientId) {
    throw new Error("TWITCH_CLIENT_ID must be set");
  }

  for (let attempt = 0; attempt < retries; attempt++) {
    const accessToken = await getIgdbAccessToken();

    const res = await fetch("https://api.igdb.com/v4/games", {
      method: "POST",
      headers: {
        "Client-ID": clientId,
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "text/plain",
      },
      body,
    });

    if (res.status === 429) {
      if (attempt < retries - 1) {
        const delay = Math.pow(2, attempt) * 1000;
        console.log(`IGDB rate limited. Retrying in ${delay}ms... (attempt ${attempt + 1}/${retries})`);
        await sleep(delay);
        continue;
      }
      throw new Error("IGDB rate limit exceeded after max retries");
    }

    if (!res.ok) {
      throw new Error(`IGDB API error: ${res.status} ${res.statusText}`);
    }

    return (await res.json()) as IgdbGame[];
  }

  throw new Error("IGDB fetch failed after max retries");
}

export async function searchIgdbGameById(igdbId: number): Promise<IgdbGame | null> {
  const query = `
    fields id, name, game_localizations.region, game_localizations.name, cover.image_id, game_modes, game_type,genres.name;
    where id = ${igdbId};
    limit 1;
  `;
  const results = await fetchIgdbWithRetry(query);
  return results[0] ?? null;
}

export async function fetchIgdbGamesByIds(ids: number[]): Promise<Map<number, IgdbGame>> {
  if (ids.length === 0) return new Map();
  const query = `
    fields id, name, game_localizations.region, game_localizations.name, cover.image_id, game_modes, game_type,genres.name;
    where id = (${ids.join(",")}) & game_type = 0 & game_modes = (2, 3);
    limit 500;
  `;
  const results = await fetchIgdbWithRetry(query);
  return new Map(results.map((g) => [g.id, g]));
}


export function buildCoverImageUrl(imageId: string): string {
  return `https://images.igdb.com/igdb/image/upload/t_cover_big/${imageId}.jpg`;
}
