import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return { ...actual, after: vi.fn((fn: () => Promise<void>) => fn()) };
});

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    room: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    chatMessage: {
      create: vi.fn(),
    },
    $queryRaw: vi.fn(),
  },
}));

vi.mock("@/lib/socket-emitter", () => ({ emitToRoom: vi.fn() }));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { emitToRoom } from "@/lib/socket-emitter";
import { POST } from "./route";

const mockAuth = vi.mocked(auth);
const mockRoomFindUnique = vi.mocked(prisma.room.findUnique);
const mockRoomFindFirst = vi.mocked(prisma.room.findFirst);
const mockUserFindUnique = vi.mocked(prisma.user.findUnique);
const mockChatMessageCreate = vi.mocked(prisma.chatMessage.create);
const mockQueryRaw = vi.mocked(prisma.$queryRaw);
const mockEmitToRoom = vi.mocked(emitToRoom);

const makeRequest = () => new Request("http://localhost/api/v1/rooms/room-1/join", { method: "POST" });
const makeParams = () => ({ params: Promise.resolve({ roomId: "room-1" }) });

const now = new Date();
const successRow = [{ max_players: 4n, cnt: 1n, ins_id: "participant-uuid", ins_joined_at: now }];
const fullRow = [{ max_players: 4n, cnt: 4n, ins_id: null, ins_joined_at: null }];
const makeAlreadyJoinedError = () =>
  Object.assign(new Error("Raw query failed"), {
    code: "P2010",
    meta: { code: "23505", message: "ERROR: duplicate key value violates unique constraint" },
  });

beforeEach(() => {
  vi.clearAllMocks();

  mockUserFindUnique.mockResolvedValue({
    username: "test-user",
    iconUrl: null,
    avgRating: 4.5,
  } as never);

  mockChatMessageCreate.mockResolvedValue({
    id: "msg-1",
    content: "test-userさんが入室しました",
    createdAt: now,
  } as never);

  mockQueryRaw.mockResolvedValue(successRow);
});

describe("POST /api/v1/rooms/[roomId]/join", () => {
  it("未認証の場合 401 UNAUTHORIZED を返す", async () => {
    mockAuth.mockResolvedValue(null as never);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("room が存在しない場合 404 ROOM_NOT_FOUND を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockRoomFindUnique.mockResolvedValue(null);
    mockRoomFindFirst.mockResolvedValue(null);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe("ROOM_NOT_FOUND");
  });

  it("room.status が closed の場合 400 ROOM_CLOSED を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockRoomFindUnique.mockResolvedValue({ id: "room-1", status: "closed", maxPlayers: 4 } as never);
    mockRoomFindFirst.mockResolvedValue(null);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("ROOM_CLOSED");
  });

  it("ホストが別の部屋に参加しようとした場合 409 HOST_CANNOT_JOIN を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockRoomFindUnique.mockResolvedValue({ id: "room-1", status: "open", maxPlayers: 4 } as never);
    mockRoomFindFirst.mockResolvedValue({ id: "room-2" } as never);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error.code).toBe("HOST_CANNOT_JOIN");
  });

  it("解散済みの部屋のホストは別の部屋に参加できる（findFirst が null）", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockRoomFindUnique.mockResolvedValue({ id: "room-1", status: "open", maxPlayers: 4 } as never);
    mockRoomFindFirst.mockResolvedValue(null);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.roomId).toBe("room-1");
  });

  it("既に参加済みの場合 409 ALREADY_JOINED を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockRoomFindUnique.mockResolvedValue({ id: "room-1", status: "open", maxPlayers: 4 } as never);
    mockRoomFindFirst.mockResolvedValue(null);
    mockQueryRaw.mockRejectedValue(makeAlreadyJoinedError());

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error.code).toBe("ALREADY_JOINED");
  });

  it("満員の場合 409 ROOM_FULL を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockRoomFindUnique.mockResolvedValue({ id: "room-1", status: "open", maxPlayers: 4 } as never);
    mockRoomFindFirst.mockResolvedValue(null);
    mockQueryRaw.mockResolvedValue(fullRow);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error.code).toBe("ROOM_FULL");
  });

  it("正常参加の場合 200 と data を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockRoomFindUnique.mockResolvedValue({ id: "room-1", status: "open", maxPlayers: 4 } as never);
    mockRoomFindFirst.mockResolvedValue(null);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.roomId).toBe("room-1");
    expect(body.data.userId).toBe("user-1");
    expect(body.data.isHost).toBe(false);
    expect(body.data.joinedAt).toBeDefined();
  });

  it("正常参加後に after() で emitToRoom が 2 回呼ばれる", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockRoomFindUnique.mockResolvedValue({ id: "room-1", status: "open", maxPlayers: 4 } as never);
    mockRoomFindFirst.mockResolvedValue(null);

    await POST(makeRequest(), makeParams());
    // after() モックが fn() を即時実行するため、Promise チェーンを drain する
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();

    expect(mockEmitToRoom).toHaveBeenCalledTimes(2);
    expect(mockEmitToRoom).toHaveBeenCalledWith(
      "chat:message",
      "room-1",
      expect.objectContaining({ isSystem: true })
    );
    expect(mockEmitToRoom).toHaveBeenCalledWith(
      "room:user_joined",
      "room-1",
      expect.objectContaining({ userId: "user-1" })
    );
  });

  it("pre-tx で room・hostRoom・user が並列取得される", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockRoomFindUnique.mockResolvedValue({ id: "room-1", status: "open", maxPlayers: 4 } as never);
    mockRoomFindFirst.mockResolvedValue(null);

    await POST(makeRequest(), makeParams());

    expect(mockRoomFindUnique).toHaveBeenCalledTimes(1);
    expect(mockRoomFindFirst).toHaveBeenCalledTimes(1);
    expect(mockUserFindUnique).toHaveBeenCalledTimes(1);
  });
});
