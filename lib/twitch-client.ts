import { getIgdbAccessToken } from "./igdb-auth";

export type TwitchGame = {
  id: string;
  igdb_id: string;
  name: string;
  box_art_url: string;
};

type TwitchGamesResponse = {
  data: TwitchGame[];
  pagination: { cursor?: string };
};

export async function fetchTopGames(first = 100): Promise<TwitchGame[]> {
  const clientId = process.env["TWITCH_CLIENT_ID"];
  if (!clientId) {
    throw new Error("TWITCH_CLIENT_ID must be set");
  }

  const accessToken = await getIgdbAccessToken();

  const res = await fetch(`https://api.twitch.tv/helix/games/top?first=${first}`, {
    headers: {
      "Client-ID": clientId,
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Twitch API error: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as TwitchGamesResponse;

  // igdb_id が null/空のエントリを除外
  return data.data.filter((g) => g.igdb_id && g.igdb_id.trim() !== "");
}
