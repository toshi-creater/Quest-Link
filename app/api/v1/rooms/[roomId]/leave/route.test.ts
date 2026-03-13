import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    room: { findUnique: vi.fn() },
    roomParticipant: { findFirst: vi.fn() },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/socket-emitter", () => ({ emitToRoom: vi.fn() }));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { emitToRoom } from "@/lib/socket-emitter";
import { POST } from "./route";

const mockAuth = vi.mocked(auth);
const mockFindUnique = vi.mocked(prisma.room.findUnique);
const mockFindFirst = vi.mocked(prisma.roomParticipant.findFirst);
const mockTransaction = vi.mocked(prisma.$transaction);
const mockEmitToRoom = vi.mocked(emitToRoom);

type MockTx = {
  roomParticipant: {
    update: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
  };
  room: { update: ReturnType<typeof vi.fn> };
  chatMessage: { create: ReturnType<typeof vi.fn> };
};

let mockTx: MockTx;

const makeRequest = () =>
  new Request("http://localhost/api/v1/rooms/room-1/leave", { method: "POST" });
const makeParams = () => ({ params: Promise.resolve({ roomId: "room-1" }) });

beforeEach(() => {
  vi.clearAllMocks();

  mockTx = {
    roomParticipant: {
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    room: { update: vi.fn() },
    chatMessage: { create: vi.fn() },
  };

  mockTransaction.mockImplementation(async (fn) => fn(mockTx as never));
});

describe("POST /api/v1/rooms/[roomId]/leave", () => {
  it("未認証の場合 401 UNAUTHORIZED を返す", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("room が存在しない場合 404 ROOM_NOT_FOUND を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue(null);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe("ROOM_NOT_FOUND");
  });

  it("部屋に参加していないユーザーの場合 400 NOT_IN_ROOM を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue({ id: "room-1", status: "open" } as never);
    mockFindFirst.mockResolvedValue(null);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("NOT_IN_ROOM");
  });

  it("一般参加者が退室した場合 204 を返し tx.roomParticipant.update(leftAt) が呼ばれる", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue({ id: "room-1", status: "open" } as never);
    mockFindFirst.mockResolvedValue({ id: "participant-1", isHost: false } as never);

    const res = await POST(makeRequest(), makeParams());

    expect(res.status).toBe(204);
    expect(mockTx.roomParticipant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "participant-1" },
        data: expect.objectContaining({ leftAt: expect.any(Date) }),
      })
    );
    expect(mockEmitToRoom).not.toHaveBeenCalled();
  });

  it("ホストが退室し後継者がいる場合 204 を返し isHost 更新と host_changed イベントが発火する", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue({ id: "room-1", status: "open" } as never);
    mockFindFirst.mockResolvedValue({ id: "participant-1", isHost: true } as never);

    const now = new Date();
    const systemMsg = {
      id: "msg-1",
      content: "user-2さんがホストになりました",
      createdAt: now,
    };

    mockTx.roomParticipant.findFirst.mockResolvedValue({
      id: "participant-2",
      userId: "user-2",
      user: { username: "user-2" },
    });
    mockTx.roomParticipant.update.mockResolvedValue({});
    mockTx.room.update.mockResolvedValue({});
    mockTx.chatMessage.create.mockResolvedValue(systemMsg);

    const res = await POST(makeRequest(), makeParams());

    expect(res.status).toBe(204);
    expect(mockTx.roomParticipant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "participant-2" },
        data: { isHost: true },
      })
    );
    expect(mockEmitToRoom).toHaveBeenCalledTimes(2);
  });

  it("ホストが退室し後継者がいない場合 204 を返し status=closed 更新と room:closed イベントが発火する", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue({ id: "room-1", status: "open" } as never);
    mockFindFirst.mockResolvedValue({ id: "participant-1", isHost: true } as never);

    mockTx.roomParticipant.findFirst.mockResolvedValue(null);
    mockTx.room.update.mockResolvedValue({});

    const res = await POST(makeRequest(), makeParams());

    expect(res.status).toBe(204);
    expect(mockTx.room.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "room-1" },
        data: expect.objectContaining({ status: "closed", closedAt: expect.any(Date) }),
      })
    );
    expect(mockEmitToRoom).toHaveBeenCalledTimes(1);
    expect(mockEmitToRoom).toHaveBeenCalledWith(
      "room:closed",
      "room-1",
      expect.objectContaining({ roomId: "room-1", closedAt: expect.any(Date) })
    );
  });

  it("ホスト引き継ぎ時に emitToRoom の引数が正しい", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue({ id: "room-1", status: "open" } as never);
    mockFindFirst.mockResolvedValue({ id: "participant-1", isHost: true } as never);

    const now = new Date();
    const systemMsg = {
      id: "msg-1",
      content: "new-userさんがホストになりました",
      createdAt: now,
    };

    mockTx.roomParticipant.findFirst.mockResolvedValue({
      id: "participant-2",
      userId: "user-2",
      user: { username: "new-user" },
    });
    mockTx.roomParticipant.update.mockResolvedValue({});
    mockTx.room.update.mockResolvedValue({});
    mockTx.chatMessage.create.mockResolvedValue(systemMsg);

    await POST(makeRequest(), makeParams());

    expect(mockEmitToRoom).toHaveBeenNthCalledWith(1, "chat:message", "room-1", {
      id: "msg-1",
      roomId: "room-1",
      user: null,
      content: "new-userさんがホストになりました",
      isSystem: true,
      createdAt: now,
    });
    expect(mockEmitToRoom).toHaveBeenNthCalledWith(2, "room:host_changed", "room-1", {
      newHostId: "user-2",
      newHostUsername: "new-user",
    });
  });
});
