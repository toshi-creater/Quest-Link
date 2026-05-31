export const MAX_CHAT_LENGTH = 1000;
export const RATE_LIMIT_WINDOW_MS = 10_000;
export const RATE_LIMIT_MAX = 10;

const rateLimitMap = new Map<string, number[]>();

export function validateLength(content: string): boolean {
  return content.length <= MAX_CHAT_LENGTH;
}

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(key) ?? []).filter(
    (t) => now - t < RATE_LIMIT_WINDOW_MS
  );
  if (timestamps.length >= RATE_LIMIT_MAX) return false;
  timestamps.push(now);
  rateLimitMap.set(key, timestamps);
  return true;
}

export function clearRateLimitMap(): void {
  rateLimitMap.clear();
}

export function pruneRateLimitMap(): void {
  const now = Date.now();
  for (const [key, timestamps] of rateLimitMap) {
    const valid = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    if (valid.length === 0) rateLimitMap.delete(key);
    else rateLimitMap.set(key, valid);
  }
}
