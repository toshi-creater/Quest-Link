import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    playStyleTag: { findMany: vi.fn() },
    game: { findMany: vi.fn() },
    userPlayStyleTag: { deleteMany: vi.fn() },
    userGame: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GET } from "./route";

const mockAuth = vi.mocked(auth);
const mockFindUnique = vi.mocked(prisma.user.findUnique);

const makeUser = (overrides: Record<string, unknown> = {}) => ({
  id: "user-1",
  username: "testuser",
  iconUrl: null,
  bio: "自己紹介文",
  avgRating: 4,
  ratingCount: 2,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  playStyleTags: [],
  games: [],
  receivedRatings: [
    {
      id: "rating-1",
      score: 5,
      comment: "また一緒にやりましょう！",
      createdAt: new Date("2026-02-01T00:00:00Z"),
      reviewer: { username: "reviewer1", iconUrl: null },
    },
    {
      id: "rating-2",
      score: 3,
      comment: null,
      createdAt: new Date("2026-01-15T00:00:00Z"),
      reviewer: { username: "reviewer2", iconUrl: "https://example.com/icon.jpg" },
    },
  ],
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/v1/users/me", () => {
  it("未認証の場合 401 UNAUTHORIZED を返す", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("UNAUTHORIZED");
  });

  it("ユーザーが存在しない場合 404 USER_NOT_FOUND を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue(null);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("USER_NOT_FOUND");
  });

  it("正常取得の場合 200 とユーザーデータを返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue(makeUser() as never);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.id).toBe("user-1");
    expect(body.data.username).toBe("testuser");
  });

  it("receivedRatings が配列として含まれる", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue(makeUser() as never);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.receivedRatings).toHaveLength(2);
  });

  it("receivedRatings の各要素に score, comment, createdAt, reviewer が含まれる", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue(makeUser() as never);

    const res = await GET();
    const body = await res.json();

    const [first] = body.data.receivedRatings as Array<{
      id: string;
      score: number;
      comment: string | null;
      createdAt: string;
      reviewer: { username: string | null; iconUrl: string | null };
    }>;
    expect(first.id).toBe("rating-1");
    expect(first.score).toBe(5);
    expect(first.comment).toBe("また一緒にやりましょう！");
    expect(first.reviewer.username).toBe("reviewer1");
    expect(first.reviewer.iconUrl).toBeNull();
  });

  it("receivedRatings が 0 件の場合は空配列を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue(makeUser({ receivedRatings: [] }) as never);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.receivedRatings).toEqual([]);
  });
});
