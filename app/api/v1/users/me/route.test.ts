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
    room: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    roomParticipant: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
    },
    chatMessage: {
      create: vi.fn(),
    },
    rating: { findMany: vi.fn() },
    playStyleTag: { findMany: vi.fn() },
    game: { findMany: vi.fn() },
    userPlayStyleTag: { deleteMany: vi.fn() },
    userGame: { deleteMany: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/socket-emitter", () => ({
  emitToRoom: vi.fn(),
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { GET, PATCH, DELETE } from "./route";

const mockAuth = vi.mocked(auth);
const mockFindUnique = vi.mocked(prisma.user.findUnique);
const mockParticipantFindMany = vi.mocked(prisma.roomParticipant.findMany);
const mockRatingFindMany = vi.mocked(prisma.rating.findMany);
const mockTransaction = prisma.$transaction as ReturnType<typeof vi.fn>;

const makeUser = () => ({
  id: "user-1",
  username: "testuser",
  iconUrl: null,
  bio: "自己紹介文",
  avgRating: 4,
  ratingCount: 2,
  createdAt: new Date("2026-01-01T00:00:00Z"),
  playStyleTags: [],
  games: [],
});

const makeRatings = () => [
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
];

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
    mockRatingFindMany.mockResolvedValue([]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error).toBe("USER_NOT_FOUND");
  });

  it("正常取得の場合 200 とユーザーデータを返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue(makeUser() as never);
    mockRatingFindMany.mockResolvedValue([]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.id).toBe("user-1");
    expect(body.data.username).toBe("testuser");
  });

  it("receivedRatings が配列として含まれる", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue(makeUser() as never);
    mockRatingFindMany.mockResolvedValue(makeRatings() as never);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.receivedRatings).toHaveLength(2);
  });

  it("receivedRatings の各要素に score, comment, createdAt, reviewer が含まれる", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue(makeUser() as never);
    mockRatingFindMany.mockResolvedValue(makeRatings() as never);

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
    mockFindUnique.mockResolvedValue(makeUser() as never);
    mockRatingFindMany.mockResolvedValue([]);

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.receivedRatings).toEqual([]);
  });
});

const makePatchRequest = (body: Record<string, unknown>) =>
  new Request("http://localhost/api/v1/users/me", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

describe("PATCH /api/v1/users/me", () => {
  it("未認証の場合 401 UNAUTHORIZED を返す", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await PATCH(makePatchRequest({ username: "newname" }));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("UNAUTHORIZED");
  });

  it("username が空文字の場合 400 BAD_REQUEST を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);

    const res = await PATCH(makePatchRequest({ username: "" }));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("BAD_REQUEST");
  });

  it("正常更新の場合 200 とユーザーデータを返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockTransaction.mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) =>
      fn({
        ...prisma,
        user: {
          ...prisma.user,
          update: vi.fn().mockResolvedValue({
            ...makeUser(),
            username: "updatedname",
          }),
        },
      } as never)
    );

    const res = await PATCH(makePatchRequest({ username: "updatedname" }));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.username).toBe("updatedname");
  });

  it("ユーザー名重複の場合 409 USERNAME_TAKEN を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    const prismaError = new Prisma.PrismaClientKnownRequestError("Unique constraint", {
      code: "P2002",
      clientVersion: "5.0.0",
    });
    mockTransaction.mockRejectedValue(prismaError);

    const res = await PATCH(makePatchRequest({ username: "takenname" }));
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toBe("USERNAME_TAKEN");
  });
});

describe("DELETE /api/v1/users/me", () => {
  it("未認証の場合 401 UNAUTHORIZED を返す", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await DELETE();
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("UNAUTHORIZED");
  });

  it("参加中ルームなしで正常退会できる場合 204 を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue({ username: "testuser" } as never);
    const mockDelete = vi.fn().mockResolvedValue(undefined);
    mockTransaction.mockImplementation(
      async (fn: (tx: typeof prisma) => Promise<unknown>) =>
        fn({
          ...prisma,
          roomParticipant: { findMany: vi.fn().mockResolvedValue([]) },
          user: { delete: mockDelete },
        } as never)
    );

    const res = await DELETE();

    expect(res.status).toBe(204);
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "user-1" } });
  });

  it("ホストとして参加中ルームがある場合、leave 処理を経て退会する", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue({ username: "hostuser" } as never);
    const leaveMsg = { id: "msg-1", content: "hostuserさんが退室しました", createdAt: new Date() };
    const systemMsg = { id: "msg-2", content: "nextさんがホストになりました", createdAt: new Date() };
    const mockParticipantFindFirst = vi.fn().mockResolvedValue({
      id: "p-2",
      userId: "user-2",
      user: { username: "next" },
    });
    const mockChatCreate = vi.fn()
      .mockResolvedValueOnce(leaveMsg)
      .mockResolvedValueOnce(systemMsg);
    const mockParticipantUpdate = vi.fn().mockResolvedValue({});
    const mockRoomUpdate = vi.fn().mockResolvedValue({});
    const mockDelete = vi.fn().mockResolvedValue(undefined);
    mockTransaction.mockImplementation(
      async (fn: (tx: typeof prisma) => Promise<unknown>) =>
        fn({
          ...prisma,
          room: { update: mockRoomUpdate },
          roomParticipant: {
            findMany: vi.fn().mockResolvedValue([{ id: "p-1", roomId: "room-1", isHost: true }]),
            findFirst: mockParticipantFindFirst,
            update: mockParticipantUpdate,
          },
          chatMessage: { create: mockChatCreate },
          user: { delete: mockDelete },
        } as never)
    );

    const res = await DELETE();

    expect(res.status).toBe(204);
    expect(mockParticipantUpdate).toHaveBeenCalledWith({
      where: { id: "p-1" },
      data: { leftAt: expect.any(Date) },
    });
    expect(mockParticipantUpdate).toHaveBeenCalledWith({
      where: { id: "p-2" },
      data: { isHost: true },
    });
    expect(mockRoomUpdate).toHaveBeenCalledWith({
      where: { id: "room-1" },
      data: { hostId: "user-2" },
    });
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "user-1" } });
  });

  it("ホスト中ルームに他の参加者がいない場合、ルームをクローズして退会する", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue({ username: "hostuser" } as never);
    const leaveMsg = { id: "msg-1", content: "hostuserさんが退室しました", createdAt: new Date() };
    const mockParticipantFindFirst = vi.fn().mockResolvedValue(null);
    const mockChatCreate = vi.fn().mockResolvedValue(leaveMsg);
    const mockParticipantUpdate = vi.fn().mockResolvedValue({});
    const mockParticipantUpdateMany = vi.fn().mockResolvedValue({ count: 0 });
    const mockRoomUpdate = vi.fn().mockResolvedValue({});
    const mockDelete = vi.fn().mockResolvedValue(undefined);
    mockTransaction.mockImplementation(
      async (fn: (tx: typeof prisma) => Promise<unknown>) =>
        fn({
          ...prisma,
          room: { update: mockRoomUpdate },
          roomParticipant: {
            findMany: vi.fn().mockResolvedValue([{ id: "p-1", roomId: "room-1", isHost: true }]),
            findFirst: mockParticipantFindFirst,
            update: mockParticipantUpdate,
            updateMany: mockParticipantUpdateMany,
          },
          chatMessage: { create: mockChatCreate },
          user: { delete: mockDelete },
        } as never)
    );

    const res = await DELETE();

    expect(res.status).toBe(204);
    expect(mockRoomUpdate).toHaveBeenCalledWith({
      where: { id: "room-1" },
      data: expect.objectContaining({ status: "closed" }),
    });
    expect(mockDelete).toHaveBeenCalledWith({ where: { id: "user-1" } });
  });
});
