import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    room: { findUnique: vi.fn() },
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
const mockTransaction = vi.mocked(prisma.$transaction);
const mockEmitToRoom = vi.mocked(emitToRoom);

type MockTx = {
  roomParticipant: { updateMany: ReturnType<typeof vi.fn> };
  room: { update: ReturnType<typeof vi.fn> };
};

let mockTx: MockTx;

const makeRequest = () =>
  new Request("http://localhost/api/v1/rooms/room-1/close", { method: "POST" });
const makeParams = () => ({ params: Promise.resolve({ roomId: "room-1" }) });

beforeEach(() => {
  vi.clearAllMocks();

  mockTx = {
    roomParticipant: { updateMany: vi.fn() },
    room: { update: vi.fn() },
  };

  mockTransaction.mockImplementation(async (fn) => fn(mockTx as never));
});

describe("POST /api/v1/rooms/[roomId]/close", () => {
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

  it("ホスト以外のユーザーの場合 403 FORBIDDEN を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue({
      id: "room-1",
      hostId: "other-user",
      status: "open",
    } as never);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("既に closed の部屋の場合 400 ROOM_ALREADY_CLOSED を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue({
      id: "room-1",
      hostId: "user-1",
      status: "closed",
    } as never);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("ROOM_ALREADY_CLOSED");
  });

  it("正常解散の場合 204 を返し updateMany・room.update・emitToRoom が呼ばれる", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue({
      id: "room-1",
      hostId: "user-1",
      status: "open",
    } as never);

    const res = await POST(makeRequest(), makeParams());

    expect(res.status).toBe(204);
    expect(mockTx.roomParticipant.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { roomId: "room-1", leftAt: null },
        data: expect.objectContaining({ leftAt: expect.any(Date) }),
      })
    );
    expect(mockTx.room.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "room-1" },
        data: expect.objectContaining({ status: "closed", closedAt: expect.any(Date) }),
      })
    );
    expect(mockEmitToRoom).toHaveBeenCalledWith(
      "room:closed",
      "room-1",
      expect.objectContaining({ roomId: "room-1", closedAt: expect.any(Date) })
    );
  });
});
