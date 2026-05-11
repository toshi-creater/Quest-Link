import { describe, it, expect, vi, beforeEach } from "vitest";
import type { Session } from "next-auth";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    room: { findMany: vi.fn(), count: vi.fn() },
    game: { findUnique: vi.fn() },
    playStyleTag: { findMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GET, POST } from "@/app/api/v1/rooms/route";

const mockAuth = vi.mocked(auth);
const mockRoomFindMany = vi.mocked(prisma.room.findMany);
const mockRoomCount = vi.mocked(prisma.room.count);
const mockGameFindUnique = vi.mocked(prisma.game.findUnique);
const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>;

// ─── フィクスチャ ──────────────────────────────────────────────────────────────

const VALID_GAME_ID = "123e4567-e89b-12d3-a456-426614174000";

const AUTHENTICATED_SESSION = {
  user: {
    id: "user-1",
    username: "host_user",
    iconUrl: null,
    avgRating: 4.5,
    name: "host_user",
    email: "host@example.com",
    image: null,
  },
  expires: "2099-01-01T00:00:00.000Z",
} as unknown as Session;

const SAMPLE_RAW_ROOM = {
  id: "room-1",
  title: "テストルーム",
  description: null,
  maxPlayers: 4,
  status: "waiting",
  createdAt: new Date("2024-01-01"),
  closedAt: null,
  game: { id: VALID_GAME_ID, name: "Apex Legends", coverImageUrl: null },
  host: { id: "user-1", username: "host_user", iconUrl: null, avgRating: 4.5 },
  playStyleTags: [],
  participants: [
    {
      userId: "user-1",
      isHost: true,
      joinedAt: new Date("2024-01-01"),
      user: { username: "host_user", iconUrl: null, avgRating: 4.5 },
    },
  ],
};

const SAMPLE_RAW_ROOM_WITH_DESC = {
  ...SAMPLE_RAW_ROOM,
  id: "room-2",
  title: "週末ゲーム会",
  description: "初心者大歓迎！スモーク使える方歓迎！",
};

// ─── ヘルパー ──────────────────────────────────────────────────────────────────

function makeGetRequest(params: Record<string, string> = {}): Request {
  const url = new URL("http://localhost/api/v1/rooms");
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return new Request(url.toString());
}

function makePostRequest(body: unknown): Request {
  return new Request("http://localhost/api/v1/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ─── テスト ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/v1/rooms", () => {
  it("未認証の場合 401 UNAUTHORIZED を返す", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const res = await GET(makeGetRequest());
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("正常系: data配列とmetaを返す", async () => {
    mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION);
    mockRoomFindMany.mockResolvedValueOnce([SAMPLE_RAW_ROOM] as never);
    mockRoomCount.mockResolvedValueOnce(1);

    const res = await GET(makeGetRequest());
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.meta).toEqual({ total: 1, page: 1, limit: 20 });
  });

  it("gameId クエリパラメータが where 句に含まれる", async () => {
    mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION);
    mockRoomFindMany.mockResolvedValueOnce([]);
    mockRoomCount.mockResolvedValueOnce(0);

    await GET(makeGetRequest({ gameId: VALID_GAME_ID }));

    expect(mockRoomFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ gameId: VALID_GAME_ID }),
      })
    );
  });

  it("正常系: q が title に一致する部屋を 200 で返す", async () => {
    mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION);
    mockRoomFindMany.mockResolvedValueOnce([SAMPLE_RAW_ROOM] as never);
    mockRoomCount.mockResolvedValueOnce(1);

    const res = await GET(makeGetRequest({ q: "テスト" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].title).toBe("テストルーム");
    expect(json.meta).toEqual({ total: 1, page: 1, limit: 20 });
  });

  it("正常系: q が description に一致する部屋を 200 で返す", async () => {
    mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION);
    mockRoomFindMany.mockResolvedValueOnce([SAMPLE_RAW_ROOM_WITH_DESC] as never);
    mockRoomCount.mockResolvedValueOnce(1);

    const res = await GET(makeGetRequest({ q: "スモーク" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].title).toBe("週末ゲーム会");
    expect(json.meta).toEqual({ total: 1, page: 1, limit: 20 });
  });

  it("q クエリパラメータが where 句の OR 条件に含まれる", async () => {
    mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION);
    mockRoomFindMany.mockResolvedValueOnce([]);
    mockRoomCount.mockResolvedValueOnce(0);

    await GET(makeGetRequest({ q: "FPS" }));

    expect(mockRoomFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: [
            { title: { contains: "FPS", mode: "insensitive" } },
            { description: { contains: "FPS", mode: "insensitive" } },
          ],
        }),
      })
    );
  });

  it("q が 101 文字以上のとき 400 BAD_REQUEST を返す", async () => {
    mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION);

    const res = await GET(makeGetRequest({ q: "a".repeat(101) }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("BAD_REQUEST");
  });

  it("q 未指定時は where 句に OR 条件が含まれない", async () => {
    mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION);
    mockRoomFindMany.mockResolvedValueOnce([]);
    mockRoomCount.mockResolvedValueOnce(0);

    await GET(makeGetRequest());

    expect(mockRoomFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ OR: expect.anything() }),
      })
    );
  });

  it("複数タグ指定時: AND 条件が where 句に展開される", async () => {
    mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION);
    mockRoomFindMany.mockResolvedValueOnce([]);
    mockRoomCount.mockResolvedValueOnce(0);

    await GET(makeGetRequest({ tagSlugs: "casual,competitive" }));

    expect(mockRoomFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: [
            { playStyleTags: { some: { tag: { slug: "casual" } } } },
            { playStyleTags: { some: { tag: { slug: "competitive" } } } },
          ],
        }),
      })
    );
  });

  it("単一タグ指定時: AND 配列が1要素で展開される", async () => {
    mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION);
    mockRoomFindMany.mockResolvedValueOnce([]);
    mockRoomCount.mockResolvedValueOnce(0);

    await GET(makeGetRequest({ tagSlugs: "casual" }));

    expect(mockRoomFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: [{ playStyleTags: { some: { tag: { slug: "casual" } } } }],
        }),
      })
    );
  });

  it("タグ未指定時は where 句に AND 条件が含まれない", async () => {
    mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION);
    mockRoomFindMany.mockResolvedValueOnce([]);
    mockRoomCount.mockResolvedValueOnce(0);

    await GET(makeGetRequest());

    expect(mockRoomFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.not.objectContaining({ AND: expect.anything() }),
      })
    );
  });
});

describe("POST /api/v1/rooms", () => {
  it("未認証の場合 401 UNAUTHORIZED を返す", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const res = await POST(makePostRequest({ title: "ルーム", gameId: VALID_GAME_ID, maxPlayers: 4 }));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error.code).toBe("UNAUTHORIZED");
  });

  it("title が空文字の場合 400 BAD_REQUEST を返す", async () => {
    mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION);

    const res = await POST(makePostRequest({ title: "", gameId: VALID_GAME_ID, maxPlayers: 4 }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("BAD_REQUEST");
  });

  it("存在しない gameId の場合 400 INVALID_GAME を返す", async () => {
    mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION);
    mockGameFindUnique.mockResolvedValueOnce(null);

    const res = await POST(makePostRequest({ title: "ルーム", gameId: VALID_GAME_ID, maxPlayers: 4 }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error.code).toBe("INVALID_GAME");
  });

  it("正常系: 201 と data.id を返す", async () => {
    mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION);
    mockGameFindUnique.mockResolvedValueOnce({ id: VALID_GAME_ID } as never);

    const mockTx = {
      room: {
        create: vi.fn().mockResolvedValue({ id: "room-1" }),
        findUniqueOrThrow: vi.fn().mockResolvedValue(SAMPLE_RAW_ROOM),
      },
      roomParticipant: { create: vi.fn().mockResolvedValue({}) },
    };

    mockTransaction.mockImplementationOnce(
      (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)
    );

    const res = await POST(makePostRequest({ title: "テストルーム", gameId: VALID_GAME_ID, maxPlayers: 4 }));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json.data.id).toBe("room-1");
  });

  it("正常系: 部屋作成時に inviteToken が自動生成される", async () => {
    mockAuth.mockResolvedValueOnce(AUTHENTICATED_SESSION);
    mockGameFindUnique.mockResolvedValueOnce({ id: VALID_GAME_ID } as never);

    const mockCreate = vi.fn().mockResolvedValue({ id: "room-1" });
    const mockTx = {
      room: {
        create: mockCreate,
        findUniqueOrThrow: vi.fn().mockResolvedValue(SAMPLE_RAW_ROOM),
      },
      roomParticipant: { create: vi.fn().mockResolvedValue({}) },
    };

    mockTransaction.mockImplementationOnce(
      (fn: (tx: typeof mockTx) => Promise<unknown>) => fn(mockTx)
    );

    await POST(makePostRequest({ title: "テストルーム", gameId: VALID_GAME_ID, maxPlayers: 4 }));

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          inviteToken: expect.stringMatching(/^[0-9a-f]{64}$/),
        }),
      })
    );
  });
});
