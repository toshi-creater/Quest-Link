import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    game: {
      findMany: vi.fn(),
    },
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GET } from "./route";

const mockAuth = vi.mocked(auth);
const mockFindMany = vi.mocked(prisma.game.findMany);

const AUTHENTICATED_SESSION = { user: { id: "user-1" } };

const MOCK_GAMES = [
  { id: "game-1", name: "Apex Legends", coverImageUrl: "https://example.com/apex.jpg" },
  { id: "game-2", name: "Valorant", coverImageUrl: "https://example.com/valorant.jpg" },
];

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/v1/games", () => {
  it("未認証の場合 401 UNAUTHORIZED を返す", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("認証済みの場合ゲーム一覧を返す", async () => {
    mockAuth.mockResolvedValue(AUTHENTICATED_SESSION as never);
    mockFindMany.mockResolvedValue(MOCK_GAMES as never);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(MOCK_GAMES);
    expect(mockFindMany).toHaveBeenCalledWith({
      where: { isActive: true },
      orderBy: { displayOrder: "asc" },
      select: { id: true, name: true, coverImageUrl: true },
    });
  });

  it("DBエラーが発生した場合 500 INTERNAL_SERVER_ERROR を返す", async () => {
    mockAuth.mockResolvedValue(AUTHENTICATED_SESSION as never);
    mockFindMany.mockRejectedValue(new Error("DB error"));

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error.code).toBe("INTERNAL_SERVER_ERROR");
  });
});
