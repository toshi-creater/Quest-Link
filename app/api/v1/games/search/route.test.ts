import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/games", () => ({
  searchGames: vi.fn(),
  getPopularGames: vi.fn(),
}));

import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { searchGames, getPopularGames } from "@/lib/games";
import { GET } from "./route";

const mockAuth = vi.mocked(auth);
const mockSearchGames = vi.mocked(searchGames);
const mockGetPopularGames = vi.mocked(getPopularGames);

const AUTHENTICATED_SESSION = { user: { id: "user-1" } };

function makeRequest(params: Record<string, string> = {}): NextRequest {
  const url = new URL("http://localhost/api/v1/games/search");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new NextRequest(url.toString());
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/v1/games/search", () => {
  it("未認証の場合 401 UNAUTHORIZED を返す", async () => {
    mockAuth.mockResolvedValue(null as never);

    const res = await GET(makeRequest({ q: "apex" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("q が 101 文字の場合 400 BAD_REQUEST を返す", async () => {
    mockAuth.mockResolvedValue(AUTHENTICATED_SESSION as never);

    const res = await GET(makeRequest({ q: "a".repeat(101) }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("BAD_REQUEST");
  });

  it("q 未指定（空文字）の場合 getPopularGames が呼ばれ 200 を返す", async () => {
    mockAuth.mockResolvedValue(AUTHENTICATED_SESSION as never);
    mockGetPopularGames.mockResolvedValue([]);

    const res = await GET(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual([]);
    expect(mockGetPopularGames).toHaveBeenCalledWith(10);
    expect(mockSearchGames).not.toHaveBeenCalled();
  });

  it('q="apex" 指定の場合 searchGames が呼ばれ 200 を返す', async () => {
    mockAuth.mockResolvedValue(AUTHENTICATED_SESSION as never);
    mockSearchGames.mockResolvedValue([]);

    const res = await GET(makeRequest({ q: "apex" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual([]);
    expect(mockSearchGames).toHaveBeenCalledWith("apex", 10);
    expect(mockGetPopularGames).not.toHaveBeenCalled();
  });

  it('q="apex"&limit=5 の場合 searchGames(apex, 5) が呼ばれる', async () => {
    mockAuth.mockResolvedValue(AUTHENTICATED_SESSION as never);
    mockSearchGames.mockResolvedValue([]);

    const res = await GET(makeRequest({ q: "apex", limit: "5" }));

    expect(res.status).toBe(200);
    expect(mockSearchGames).toHaveBeenCalledWith("apex", 5);
  });

  it("searchGames が例外を投げた場合 500 INTERNAL_SERVER_ERROR を返す", async () => {
    mockAuth.mockResolvedValue(AUTHENTICATED_SESSION as never);
    mockSearchGames.mockRejectedValue(new Error("DB error"));

    const res = await GET(makeRequest({ q: "apex" }));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
  });
});
