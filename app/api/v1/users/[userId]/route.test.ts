import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    block: {
      findUnique: vi.fn(),
    },
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GET } from "./route";

const mockAuth = vi.mocked(auth);
const mockFindUnique = vi.mocked(prisma.user.findUnique);
const mockBlockFindUnique = vi.mocked(prisma.block.findUnique);

const makeParams = (userId = "user-2") => ({
  params: Promise.resolve({ userId }),
});

const makeUser = () => ({
  id: "user-2",
  username: "otheruser",
  iconUrl: null,
  bio: null,
  avgRating: 3,
  ratingCount: 1,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  playStyleTags: [],
  games: [],
});

beforeEach(() => {
  vi.clearAllMocks();
  mockBlockFindUnique.mockResolvedValue(null);
});

describe("GET /api/v1/users/[userId]", () => {
  it("未認証の場合 401 UNAUTHORIZED を返す", async () => {
    mockAuth.mockResolvedValue(null as never);

    const res = await GET(new Request("http://localhost"), makeParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("UNAUTHORIZED");
  });

  it("ユーザーが存在しない場合 404 USER_NOT_FOUND を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue(null);

    const res = await GET(new Request("http://localhost"), makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("USER_NOT_FOUND");
  });

  it("正常取得の場合 200 とユーザーデータを返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue(makeUser() as never);

    const res = await GET(new Request("http://localhost"), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.id).toBe("user-2");
    expect(body.data.username).toBe("otheruser");
    expect(body.data.isBlocked).toBe(false);
    expect(body.data.isMe).toBe(false);
  });

  it("レスポンスに receivedRatings が含まれない", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue(makeUser() as never);

    const res = await GET(new Request("http://localhost"), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.receivedRatings).toBeUndefined();
  });

  it("ブロック済みユーザーの場合 isBlocked が true になる", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue(makeUser() as never);
    mockBlockFindUnique.mockResolvedValue({ blockerId: "user-1" } as never);

    const res = await GET(new Request("http://localhost"), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.isBlocked).toBe(true);
  });

  it("自分自身のプロフィールの場合 isMe が true になる", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-2" } } as never);
    mockFindUnique.mockResolvedValue(makeUser() as never);

    const res = await GET(new Request("http://localhost"), makeParams("user-2"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.isMe).toBe(true);
  });
});
