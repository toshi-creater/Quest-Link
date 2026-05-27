import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  MAX_CHAT_LENGTH,
  RATE_LIMIT_MAX,
  RATE_LIMIT_WINDOW_MS,
  validateLength,
  checkRateLimit,
  clearRateLimitMap,
} from "./moderation";

describe("validateLength", () => {
  it("999文字はOK", () => {
    expect(validateLength("a".repeat(999))).toBe(true);
  });

  it("1000文字はOK（境界値）", () => {
    expect(validateLength("a".repeat(MAX_CHAT_LENGTH))).toBe(true);
  });

  it("1001文字はNG（境界値+1）", () => {
    expect(validateLength("a".repeat(MAX_CHAT_LENGTH + 1))).toBe(false);
  });

  it("空文字はOK", () => {
    expect(validateLength("")).toBe(true);
  });
});

describe("checkRateLimit", () => {
  beforeEach(() => {
    clearRateLimitMap();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it(`${RATE_LIMIT_MAX}件以内は通過する`, () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      expect(checkRateLimit("user-1")).toBe(true);
    }
  });

  it(`${RATE_LIMIT_MAX + 1}件目はブロックされる`, () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit("user-1");
    }
    expect(checkRateLimit("user-1")).toBe(false);
  });

  it("ウィンドウ経過後はリセットされる", () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit("user-1");
    }
    expect(checkRateLimit("user-1")).toBe(false);

    vi.advanceTimersByTime(RATE_LIMIT_WINDOW_MS + 1);

    expect(checkRateLimit("user-1")).toBe(true);
  });

  it("ユーザーごとに独立してカウントされる", () => {
    for (let i = 0; i < RATE_LIMIT_MAX; i++) {
      checkRateLimit("user-1");
    }
    expect(checkRateLimit("user-1")).toBe(false);
    expect(checkRateLimit("user-2")).toBe(true);
  });
});
