import type { OauthProvider } from "@prisma/client";

/**
 * NextAuth provider ID → Prisma OauthProvider enum
 * NextAuth uses "twitter" for X (formerly Twitter)
 */
export function toDbProvider(provider: string): OauthProvider {
  if (provider === "twitter") return "x";
  if (provider === "google") return "google";
  if (provider === "discord") return "discord";
  throw new Error(`Unsupported provider: ${provider}`);
}

/**
 * Extract the provider-specific user ID from the OAuth profile.
 * - Google: profile.sub (standard OIDC)
 * - Twitter (X): profile.data.id (Twitter v2 API)
 * - Discord: profile.id
 */
export function extractProviderUserId(
  provider: string,
  profile: Record<string, unknown>
): string | null {
  if (provider === "google") {
    return typeof profile.sub === "string" ? profile.sub : null;
  }
  if (provider === "twitter") {
    const data = profile.data as Record<string, unknown> | undefined;
    return typeof data?.id === "string" ? data.id : null;
  }
  if (provider === "discord") {
    return typeof profile.id === "string" ? profile.id : null;
  }
  return null;
}

/**
 * Extract an avatar URL from the OAuth profile.
 * Falls back to null if not available.
 */
export function extractAvatarUrl(
  provider: string,
  profile: Record<string, unknown>
): string | null {
  if (provider === "google") {
    return typeof profile.picture === "string" ? profile.picture : null;
  }
  if (provider === "twitter") {
    const data = profile.data as Record<string, unknown> | undefined;
    return typeof data?.profile_image_url === "string"
      ? data.profile_image_url
      : null;
  }
  if (provider === "discord") {
    // Discord avatar: https://cdn.discordapp.com/avatars/{id}/{avatar}.png
    const id = profile.id as string | undefined;
    const avatar = profile.avatar as string | null | undefined;
    if (id && avatar) {
      return `https://cdn.discordapp.com/avatars/${id}/${avatar}.png`;
    }
    return null;
  }
  return null;
}
