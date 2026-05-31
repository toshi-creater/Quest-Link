import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    room: { findUnique: vi.fn() },
    roomParticipant: { findFirst: vi.fn(), count: vi.fn() },
    user: { findUnique: vi.fn() },
    guest: { findUnique: vi.fn() },
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
const mockParticipantFindFirst = vi.mocked(prisma.roomParticipant.findFirst);
const mockParticipantCount = vi.mocked(prisma.roomParticipant.count);
const mockUserFindUnique = vi.mocked(prisma.user.findUnique);
const mockGuestFindUnique = vi.mocked(prisma.guest.findUnique);
const mockTransaction = vi.mocked(prisma.$transaction);
const mockEmitToRoom = vi.mocked(emitToRoom);

type MockTx = {
  roomParticipant: { update: ReturnType<typeof vi.fn> };
  room: { update: ReturnType<typeof vi.fn> };
  chatMessage: { create: ReturnType<typeof vi.fn> };
};

let mockTx: MockTx;

const makeRequest = (body: object) =>
  new Request("http://localhost/api/v1/rooms/room-1/kick", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
const makeParams = () => ({ params: Promise.resolve({ roomId: "room-1" }) });

const openRoom = { id: "room-1", hostId: "host-1", status: "waiting", maxPlayers: 4 };
const fullRoom = { id: "room-1", hostId: "host-1", status: "full", maxPlayers: 4 };

beforeEach(() => {
  vi.clearAllMocks();

  mockTx = {
    roomParticipant: { update: vi.fn() },
    room: { update: vi.fn() },
    chatMessage: {
      create: vi.fn().mockResolvedValue({
        id: "msg-1",
        content: "テストさんはホストにキックされました",
        isSystem: true,
        createdAt: new Date(),
      }),
    },
  };

  mockTransaction.mockImplementation(async (fn) => fn(mockTx as never));
  mockParticipantCount.mockResolvedValue(4);
  mockUserFindUnique.mockResolvedValue({ username: "テスト" } as never);
});

describe("POST /api/v1/rooms/[roomId]/kick", () => {
  it("未認証の場合 401 UNAUTHORIZED を返す", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest({ userId: "user-2" }), makeParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("room が存在しない場合 404 ROOM_NOT_FOUND を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "host-1" } } as never);
    mockRoomFindUnique.mockResolvedValue(null);

    const res = await POST(makeRequest({ userId: "user-2" }), makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe("ROOM_NOT_FOUND");
  });

  it("ホスト以外のユーザーの場合 403 FORBIDDEN を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-2" } } as never);
    mockRoomFindUnique.mockResolvedValue(openRoom as never);

    const res = await POST(makeRequest({ userId: "user-3" }), makeParams());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("部屋が closed の場合 400 ROOM_CLOSED を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "host-1" } } as never);
    mockRoomFindUnique.mockResolvedValue({ ...openRoom, status: "closed" } as never);

    const res = await POST(makeRequest({ userId: "user-2" }), makeParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("ROOM_CLOSED");
  });

  it("自分自身を指定した場合 400 CANNOT_KICK_SELF を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "host-1" } } as never);
    mockRoomFindUnique.mockResolvedValue(openRoom as never);

    const res = await POST(makeRequest({ userId: "host-1" }), makeParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("CANNOT_KICK_SELF");
  });

  it("対象が参加中でない場合 404 PARTICIPANT_NOT_FOUND を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "host-1" } } as never);
    mockRoomFindUnique.mockResolvedValue(openRoom as never);
    mockParticipantFindFirst.mockResolvedValue(null);

    const res = await POST(makeRequest({ userId: "user-2" }), makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe("PARTICIPANT_NOT_FOUND");
  });

  it("ホストを対象に指定した場合 400 CANNOT_KICK_HOST を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "host-1" } } as never);
    mockRoomFindUnique.mockResolvedValue(openRoom as never);
    mockParticipantFindFirst.mockResolvedValue({ id: "p-1", isHost: true } as never);

    const res = await POST(makeRequest({ userId: "user-2" }), makeParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("CANNOT_KICK_HOST");
  });

  it("正常キックの場合 204 を返し participant 更新・emitToRoom が呼ばれる", async () => {
    mockAuth.mockResolvedValue({ user: { id: "host-1" } } as never);
    mockRoomFindUnique.mockResolvedValue(openRoom as never);
    mockParticipantFindFirst.mockResolvedValue({ id: "p-1", isHost: false } as never);

    const res = await POST(makeRequest({ userId: "user-2" }), makeParams());

    expect(res.status).toBe(204);
    expect(mockTx.roomParticipant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "p-1" },
        data: expect.objectContaining({ leftAt: expect.any(Date) }),
      })
    );
    expect(mockEmitToRoom).toHaveBeenCalledWith(
      "room:user_kicked",
      "room-1",
      expect.objectContaining({ kickedUserId: "user-2", byHostId: "host-1" })
    );
  });

  it("full 部屋からキックで waiting に戻る", async () => {
    mockAuth.mockResolvedValue({ user: { id: "host-1" } } as never);
    mockRoomFindUnique.mockResolvedValue(fullRoom as never);
    mockParticipantFindFirst.mockResolvedValue({ id: "p-1", isHost: false } as never);
    mockParticipantCount.mockResolvedValue(4);

    const res = await POST(makeRequest({ userId: "user-2" }), makeParams());

    expect(res.status).toBe(204);
    expect(mockTx.room.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "room-1" },
        data: { status: "waiting" },
      })
    );
  });

  it("ゲスト参加者を guestSessionId でキックできる", async () => {
    mockAuth.mockResolvedValue({ user: { id: "host-1" } } as never);
    mockRoomFindUnique.mockResolvedValue(openRoom as never);
    mockParticipantFindFirst.mockResolvedValue({ id: "p-2", isHost: false } as never);
    mockGuestFindUnique.mockResolvedValue({ displayName: "ゲストA" } as never);

    const res = await POST(makeRequest({ guestSessionId: "guest-session-1" }), makeParams());

    expect(res.status).toBe(204);
    expect(mockEmitToRoom).toHaveBeenCalledWith(
      "room:user_kicked",
      "room-1",
      expect.objectContaining({ kickedGuestSessionId: "guest-session-1", kickedUserId: null })
    );
  });

  it("userId も guestSessionId もない場合 404 PARTICIPANT_NOT_FOUND を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "host-1" } } as never);
    mockRoomFindUnique.mockResolvedValue(openRoom as never);

    const res = await POST(makeRequest({}), makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe("PARTICIPANT_NOT_FOUND");
  });
});
