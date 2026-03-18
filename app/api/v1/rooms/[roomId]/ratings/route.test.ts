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
    },
    rating: {
      findFirst: vi.fn(),
      aggregate: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { POST } from "./route";

const mockAuth = vi.mocked(auth);
const mockRoomFindUnique = vi.mocked(prisma.room.findUnique);
const mockParticipantFindFirst = vi.mocked(prisma.roomParticipant.findFirst);
const mockRatingFindFirst = vi.mocked(prisma.rating.findFirst);
const mockTransaction = vi.mocked(prisma.$transaction);

type MockTx = {
  rating: {
    create: ReturnType<typeof vi.fn>;
    aggregate: ReturnType<typeof vi.fn>;
  };
  user: {
    update: ReturnType<typeof vi.fn>;
  };
};

let mockTx: MockTx;

const closedAt = new Date(Date.now() - 60 * 60 * 1000); // 1時間前
const validRoom = { id: "room-1", closedAt };

const makeRequest = (body: unknown = { revieweeId: "user-2", score: 4 }) =>
  new Request("http://localhost/api/v1/rooms/room-1/ratings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const makeParams = () => ({ params: Promise.resolve({ roomId: "room-1" }) });

beforeEach(() => {
  vi.clearAllMocks();

  mockTx = {
    rating: {
      create: vi.fn(),
      aggregate: vi.fn(),
    },
    user: {
      update: vi.fn(),
    },
  };

  mockTransaction.mockImplementation(async (fn) => fn(mockTx as never));
});

describe("POST /api/v1/rooms/[roomId]/ratings", () => {
  it("未認証の場合 401 UNAUTHORIZED を返す", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("score が 0 の場合 400 INVALID_SCORE を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);

    const res = await POST(makeRequest({ revieweeId: "user-2", score: 0 }), makeParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("INVALID_SCORE");
  });

  it("score が 6 の場合 400 INVALID_SCORE を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);

    const res = await POST(makeRequest({ revieweeId: "user-2", score: 6 }), makeParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("INVALID_SCORE");
  });

  it("自己評価の場合 400 SELF_RATING を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);

    const res = await POST(makeRequest({ revieweeId: "user-1", score: 3 }), makeParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("SELF_RATING");
  });

  it("room が存在しない場合 404 ROOM_NOT_FOUND を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockRoomFindUnique.mockResolvedValue(null);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe("ROOM_NOT_FOUND");
  });

  it("reviewer の leftAt が null かつ room.closedAt も null の場合 400 NOT_LEFT を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockRoomFindUnique.mockResolvedValue({ id: "room-1", closedAt: null } as never);
    mockParticipantFindFirst.mockResolvedValue({ leftAt: null } as never);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("NOT_LEFT");
  });

  it("24時間超過の場合 400 RATING_EXPIRED を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    const expiredLeftAt = new Date(Date.now() - 25 * 60 * 60 * 1000);
    mockRoomFindUnique.mockResolvedValue({ id: "room-1", closedAt: null } as never);
    mockParticipantFindFirst.mockResolvedValue({ leftAt: expiredLeftAt } as never);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("RATING_EXPIRED");
  });

  it("reviewer が参加者でない場合 403 NOT_PARTICIPATED を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockRoomFindUnique.mockResolvedValue(validRoom as never);
    mockParticipantFindFirst.mockResolvedValue(null);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe("NOT_PARTICIPATED");
  });

  it("reviewee が参加者でない場合 403 NOT_PARTICIPATED を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockRoomFindUnique.mockResolvedValue(validRoom as never);
    // reviewer は参加済み、reviewee は未参加
    mockParticipantFindFirst
      .mockResolvedValueOnce({ id: "p-1" } as never)
      .mockResolvedValueOnce(null);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe("NOT_PARTICIPATED");
  });

  it("重複評価の場合 409 ALREADY_RATED を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockRoomFindUnique.mockResolvedValue(validRoom as never);
    mockParticipantFindFirst.mockResolvedValue({ id: "p-1" } as never);
    mockRatingFindFirst.mockResolvedValue({ id: "rating-1" } as never);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error.code).toBe("ALREADY_RATED");
  });

  it("reviewer の leftAt が設定済み（room.closedAt が null）の場合 201 を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    const recentLeftAt = new Date(Date.now() - 60 * 60 * 1000); // 1時間前
    mockRoomFindUnique.mockResolvedValue({ id: "room-1", closedAt: null } as never);
    mockParticipantFindFirst
      .mockResolvedValueOnce({ leftAt: recentLeftAt } as never)
      .mockResolvedValueOnce({ leftAt: null } as never);
    mockRatingFindFirst.mockResolvedValue(null);

    const expiresAtFromLeftAt = new Date(recentLeftAt.getTime() + 24 * 60 * 60 * 1000);
    const createdRating = {
      id: "rating-1",
      roomId: "room-1",
      revieweeId: "user-2",
      score: 4,
      comment: null,
      createdAt: new Date(),
      expiresAt: expiresAtFromLeftAt,
    };

    mockTx.rating.create.mockResolvedValue(createdRating);
    mockTx.rating.aggregate.mockResolvedValue({ _avg: { score: 4 }, _count: { score: 1 } });
    mockTx.user.update.mockResolvedValue({});

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.id).toBe("rating-1");
  });

  it("正常送信の場合 201 と rating データを返し user.update が呼ばれる", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockRoomFindUnique.mockResolvedValue(validRoom as never);
    mockParticipantFindFirst.mockResolvedValue({ id: "p-1" } as never);
    mockRatingFindFirst.mockResolvedValue(null);

    const now = new Date();
    const expiresAt = new Date(closedAt.getTime() + 24 * 60 * 60 * 1000);
    const createdRating = {
      id: "rating-1",
      roomId: "room-1",
      revieweeId: "user-2",
      score: 4,
      comment: null,
      createdAt: now,
      expiresAt,
    };

    mockTx.rating.create.mockResolvedValue(createdRating);
    mockTx.rating.aggregate.mockResolvedValue({
      _avg: { score: 4 },
      _count: { score: 1 },
    });
    mockTx.user.update.mockResolvedValue({});

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.data.id).toBe("rating-1");
    expect(body.data.roomId).toBe("room-1");
    expect(body.data.revieweeId).toBe("user-2");
    expect(body.data.score).toBe(4);
    expect(mockTx.user.update).toHaveBeenCalledWith({
      where: { id: "user-2" },
      data: { avgRating: 4, ratingCount: 1 },
    });
  });
});
