import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    room: {
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    chatMessage: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/socket-emitter", () => ({ emitToRoom: vi.fn() }));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { emitToRoom } from "@/lib/socket-emitter";
import { POST } from "./route";

const mockAuth = vi.mocked(auth);
const mockRoomFindUnique = vi.mocked(prisma.room.findUnique);
const mockUserFindUnique = vi.mocked(prisma.user.findUnique);
const mockChatMessageCreate = vi.mocked(prisma.chatMessage.create);
const mockTransaction = vi.mocked(prisma.$transaction);
const mockEmitToRoom = vi.mocked(emitToRoom);

type MockTx = {
  $queryRaw: ReturnType<typeof vi.fn>;
  roomParticipant: {
    count: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  room: {
    update: ReturnType<typeof vi.fn>;
  };
};

let mockTx: MockTx;

const makeRequest = () => new Request("http://localhost/api/v1/rooms/room-1/join", { method: "POST" });
const makeParams = () => ({ params: Promise.resolve({ roomId: "room-1" }) });

beforeEach(() => {
  vi.clearAllMocks();

  mockTx = {
    $queryRaw: vi.fn().mockResolvedValue([]),
    roomParticipant: {
      count: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    room: {
      update: vi.fn(),
    },
  };

  mockTransaction.mockImplementation(async (fn) => fn(mockTx as never));

  mockUserFindUnique.mockResolvedValue({
    username: "test-user",
    iconUrl: null,
    avgRating: 4.5,
  } as never);

  mockChatMessageCreate.mockResolvedValue({
    id: "msg-1",
    content: "test-userさんが入室しました",
    createdAt: new Date(),
  } as never);
});

describe("POST /api/v1/rooms/[roomId]/join", () => {
  it("未認証の場合 401 UNAUTHORIZED を返す", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("room が存在しない場合 404 ROOM_NOT_FOUND を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockRoomFindUnique.mockResolvedValue(null);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe("ROOM_NOT_FOUND");
  });

  it("room.status が closed の場合 400 ROOM_CLOSED を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockRoomFindUnique.mockResolvedValue({ id: "room-1", status: "closed", maxPlayers: 4 } as never);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("ROOM_CLOSED");
  });

  it("ホストが別の部屋に参加しようとした場合 409 HOST_CANNOT_JOIN を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockRoomFindUnique.mockResolvedValueOnce({ id: "room-1", status: "open", maxPlayers: 4 } as never);
    mockRoomFindUnique.mockResolvedValueOnce({ id: "room-2" } as never);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error.code).toBe("HOST_CANNOT_JOIN");
  });

  it("既に参加済みの場合 409 ALREADY_JOINED を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockRoomFindUnique.mockResolvedValue({ id: "room-1", status: "open", maxPlayers: 4 } as never);

    mockTx.roomParticipant.count.mockResolvedValue(1);
    mockTx.roomParticipant.findFirst.mockResolvedValue({ id: "participant-1" });

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error.code).toBe("ALREADY_JOINED");
  });

  it("満員の場合 409 ROOM_FULL を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockRoomFindUnique.mockResolvedValue({ id: "room-1", status: "open", maxPlayers: 4 } as never);

    mockTx.roomParticipant.count.mockResolvedValue(4);
    mockTx.roomParticipant.findFirst.mockResolvedValue(null);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error.code).toBe("ROOM_FULL");
  });

  it("正常参加（満員にならない）場合 200 と data を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockRoomFindUnique.mockResolvedValue({ id: "room-1", status: "open", maxPlayers: 4 } as never);

    const now = new Date();
    mockTx.roomParticipant.count.mockResolvedValue(1);
    mockTx.roomParticipant.findFirst.mockResolvedValue(null);
    mockTx.roomParticipant.create.mockResolvedValue({
      roomId: "room-1",
      userId: "user-1",
      isHost: false,
      joinedAt: now,
    });

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.roomId).toBe("room-1");
    expect(body.data.userId).toBe("user-1");
    expect(body.data.isHost).toBe(false);
    expect(body.data.joinedAt).toBeDefined();
    expect(mockTx.room.update).not.toHaveBeenCalled();
    expect(mockEmitToRoom).toHaveBeenCalledTimes(2);
    expect(mockEmitToRoom).toHaveBeenCalledWith("chat:message", "room-1", expect.objectContaining({ isSystem: true }));
    expect(mockEmitToRoom).toHaveBeenCalledWith("room:user_joined", "room-1", expect.objectContaining({ userId: "user-1" }));
  });

  it("正常参加（満員になる）場合 room.update({ status: 'full' }) が呼ばれる", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockRoomFindUnique.mockResolvedValue({ id: "room-1", status: "open", maxPlayers: 4 } as never);

    const now = new Date();
    mockTx.roomParticipant.count.mockResolvedValue(3);
    mockTx.roomParticipant.findFirst.mockResolvedValue(null);
    mockTx.roomParticipant.create.mockResolvedValue({
      roomId: "room-1",
      userId: "user-1",
      isHost: false,
      joinedAt: now,
    });
    mockTx.room.update.mockResolvedValue({});

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockTx.room.update).toHaveBeenCalledWith({
      where: { id: "room-1" },
      data: { status: "full" },
    });
    expect(body.data.roomId).toBe("room-1");
  });
});
