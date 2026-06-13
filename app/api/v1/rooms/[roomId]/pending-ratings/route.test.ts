import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    room: {
      findUnique: vi.fn(),
    },
    roomParticipant: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    rating: {
      findMany: vi.fn(),
    },
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GET } from "./route";

const mockAuth = vi.mocked(auth);
const mockRoomFindUnique = vi.mocked(prisma.room.findUnique);
const mockParticipantFindFirst = vi.mocked(prisma.roomParticipant.findFirst);
const mockParticipantFindMany = vi.mocked(prisma.roomParticipant.findMany);
const mockRatingFindMany = vi.mocked(prisma.rating.findMany);

const makeRequest = () =>
  new Request("http://localhost/api/v1/rooms/room-1/pending-ratings", { method: "GET" });
const makeParams = () => ({ params: Promise.resolve({ roomId: "room-1" }) });

const closedAt = new Date(Date.now() - 60 * 60 * 1000); // 1時間前

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/v1/rooms/[roomId]/pending-ratings", () => {
  it("未認証の場合 401 UNAUTHORIZED を返す", async () => {
    mockAuth.mockResolvedValue(null as never);

    const res = await GET(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("room が存在しない場合 404 ROOM_NOT_FOUND を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockRoomFindUnique.mockResolvedValue(null);

    const res = await GET(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe("ROOM_NOT_FOUND");
  });

  it("24時間超過の場合 200 で空配列を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    const expiredClosedAt = new Date(Date.now() - 25 * 60 * 60 * 1000);
    mockRoomFindUnique.mockResolvedValue({ id: "room-1", closedAt: expiredClosedAt } as never);

    const res = await GET(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it("leftAt が null かつ closedAt が null の場合 200 で空配列を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockRoomFindUnique.mockResolvedValue({ id: "room-1", closedAt: null } as never);
    mockParticipantFindFirst.mockResolvedValue({ leftAt: null } as never);

    const res = await GET(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it("leftAt が設定済み（room.closedAt null）の場合、正常取得できる", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockRoomFindUnique.mockResolvedValue({ id: "room-1", closedAt: null } as never);
    const recentLeftAt = new Date(Date.now() - 60 * 60 * 1000); // 1時間前
    mockParticipantFindFirst.mockResolvedValue({ leftAt: recentLeftAt } as never);

    mockParticipantFindMany.mockResolvedValue([
      {
        userId: "user-2",
        user: { username: "Player2", iconUrl: null, avgRating: null },
      },
    ] as never);

    mockRatingFindMany.mockResolvedValue([]);

    const res = await GET(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].userId).toBe("user-2");
  });

  it("正常取得: 自分を除く・評価済みを除く未評価ユーザーを返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockRoomFindUnique.mockResolvedValue({ id: "room-1", closedAt } as never);

    // user-2 は未評価、user-3 は評価済み
    mockParticipantFindMany.mockResolvedValue([
      {
        userId: "user-2",
        user: { username: "Player2", iconUrl: null, avgRating: null },
      },
      {
        userId: "user-3",
        user: { username: "Player3", iconUrl: "https://example.com/icon.png", avgRating: 4.5 },
      },
    ] as never);

    mockRatingFindMany.mockResolvedValue([{ revieweeId: "user-3" }] as never);

    const res = await GET(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].userId).toBe("user-2");
    expect(body.data[0].username).toBe("Player2");
    expect(body.data[0].avgRating).toBeNull();
    expect(body.data[0].expiresAt).toBeDefined();
  });

  it("全員評価済みの場合 200 で空配列を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockRoomFindUnique.mockResolvedValue({ id: "room-1", closedAt } as never);

    mockParticipantFindMany.mockResolvedValue([
      {
        userId: "user-2",
        user: { username: "Player2", iconUrl: null, avgRating: null },
      },
    ] as never);

    mockRatingFindMany.mockResolvedValue([{ revieweeId: "user-2" }] as never);

    const res = await GET(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual([]);
  });
});
