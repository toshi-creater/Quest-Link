// Twitch OAuth Client Credentials フロー
// モジュールレベルキャッシュ + 60秒バッファで自動再取得

type TokenCache = {
  accessToken: string;
  expiresAt: number; // Unix timestamp in ms
};

let cache: TokenCache | null = null;

type TwitchTokenResponse = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

export async function getIgdbAccessToken(): Promise<string> {
  const clientId = process.env["TWITCH_CLIENT_ID"];
  const clientSecret = process.env["TWITCH_CLIENT_SECRET"];

  if (!clientId || !clientSecret) {
    throw new Error("TWITCH_CLIENT_ID and TWITCH_CLIENT_SECRET must be set");
  }

  const now = Date.now();
  const buffer = 60 * 1000; // 60 seconds

  if (cache && cache.expiresAt - buffer > now) {
    return cache.accessToken;
  }

  const params = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  const res = await fetch("https://id.twitch.tv/oauth2/token", {
    method: "POST",
    body: params,
  });

  if (!res.ok) {
    throw new Error(`Twitch token request failed: ${res.status} ${res.statusText}`);
  }

  const data = (await res.json()) as TwitchTokenResponse;

  cache = {
    accessToken: data.access_token,
    expiresAt: now + data.expires_in * 1000,
  };

  return cache.accessToken;
}
