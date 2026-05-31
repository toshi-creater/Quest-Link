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
    room: { findUnique: vi.fn() },
    roomParticipant: { findFirst: vi.fn(), update: vi.fn() },
    user: { findUnique: vi.fn() },
    guest: { findUnique: vi.fn() },
    chatMessage: { create: vi.fn() },
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
const mockParticipantUpdate = vi.mocked(prisma.roomParticipant.update);
const mockUserFindUnique = vi.mocked(prisma.user.findUnique);
const mockGuestFindUnique = vi.mocked(prisma.guest.findUnique);
const mockChatMessageCreate = vi.mocked(prisma.chatMessage.create);
const mockTransaction = vi.mocked(prisma.$transaction);
const mockEmitToRoom = vi.mocked(emitToRoom);

type MockTx = {
  roomParticipant: {
    update: ReturnType<typeof vi.fn>;
    findFirst: ReturnType<typeof vi.fn>;
    updateMany: ReturnType<typeof vi.fn>;
  };
  room: { update: ReturnType<typeof vi.fn> };
  chatMessage: { create: ReturnType<typeof vi.fn> };
};

let mockTx: MockTx;

const makeRequest = (cookie?: string) =>
  new Request("http://localhost/api/v1/rooms/room-1/leave", {
    method: "POST",
    headers: cookie ? { cookie } : {},
  });
const makeParams = () => ({ params: Promise.resolve({ roomId: "room-1" }) });

beforeEach(() => {
  vi.clearAllMocks();

  mockTx = {
    roomParticipant: {
      update: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    room: { update: vi.fn() },
    chatMessage: { create: vi.fn().mockResolvedValue({ id: "leave-msg-1", content: "leaving", createdAt: new Date() }) },
  };

  mockTransaction.mockImplementation(async (fn) => fn(mockTx as never));

  mockUserFindUnique.mockResolvedValue({ username: "user-1-name" } as never);
  mockParticipantUpdate.mockResolvedValue({} as never);
  mockChatMessageCreate.mockResolvedValue({ id: "leave-msg-1", content: "ゲストさんが退室しました", createdAt: new Date() } as never);
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
    // 退室メッセージ (chat:message) + room:user_left
    expect(mockEmitToRoom).toHaveBeenCalledTimes(2);
    expect(mockEmitToRoom).toHaveBeenCalledWith("chat:message", "room-1", expect.objectContaining({ isSystem: true }));
    expect(mockEmitToRoom).toHaveBeenCalledWith("room:user_left", "room-1", expect.objectContaining({ userId: "user-1" }));
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
    // 1回目: leaveMsg, 2回目: hostChangeMsg
    mockTx.chatMessage.create
      .mockResolvedValueOnce({ id: "leave-msg-1", content: "user-1-nameさんが退室しました", createdAt: now })
      .mockResolvedValueOnce(systemMsg);

    const res = await POST(makeRequest(), makeParams());

    expect(res.status).toBe(204);
    expect(mockTx.roomParticipant.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "participant-2" },
        data: { isHost: true },
      })
    );
    // 退室msg + room:user_left + ホスト変更msg + room:host_changed = 4回
    expect(mockEmitToRoom).toHaveBeenCalledTimes(4);
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
    // 退室msg + room:user_left + room:closed = 3回
    expect(mockEmitToRoom).toHaveBeenCalledTimes(3);
    expect(mockEmitToRoom).toHaveBeenCalledWith(
      "room:closed",
      "room-1",
      expect.objectContaining({ roomId: "room-1", closedAt: expect.any(Date) })
    );
  });

  describe("ゲスト退室", () => {
    it("クッキーなしの場合 401 UNAUTHORIZED を返す", async () => {
      mockAuth.mockResolvedValue(null);

      const res = await POST(makeRequest(), makeParams());
      const body = await res.json();

      expect(res.status).toBe(401);
      expect(body.error.code).toBe("UNAUTHORIZED");
    });

    it("ゲストが部屋に参加していない場合 400 NOT_IN_ROOM を返す", async () => {
      mockAuth.mockResolvedValue(null);
      mockFindFirst.mockResolvedValue(null);

      const res = await POST(makeRequest("quest_link_guest_session=guest_abc"), makeParams());
      const body = await res.json();

      expect(res.status).toBe(400);
      expect(body.error.code).toBe("NOT_IN_ROOM");
    });

    it("ゲストが正常退室した場合 204 を返し leftAt が更新される", async () => {
      mockAuth.mockResolvedValue(null);
      mockFindFirst.mockResolvedValue({ id: "participant-g1" } as never);
      mockGuestFindUnique.mockResolvedValue({ displayName: "ゲストA" } as never);

      const res = await POST(makeRequest("quest_link_guest_session=guest_abc"), makeParams());

      expect(res.status).toBe(204);
      expect(mockParticipantUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "participant-g1" },
          data: expect.objectContaining({ leftAt: expect.any(Date) }),
        })
      );
    });

    it("ゲスト退室時に chat:message と room:user_left が emit される", async () => {
      mockAuth.mockResolvedValue(null);
      mockFindFirst.mockResolvedValue({ id: "participant-g1" } as never);
      mockGuestFindUnique.mockResolvedValue({ displayName: "ゲストA" } as never);

      await POST(makeRequest("quest_link_guest_session=guest_abc"), makeParams());

      expect(mockEmitToRoom).toHaveBeenCalledTimes(2);
      expect(mockEmitToRoom).toHaveBeenCalledWith("chat:message", "room-1", expect.objectContaining({ isSystem: true }));
      expect(mockEmitToRoom).toHaveBeenCalledWith("room:user_left", "room-1", expect.objectContaining({ userId: "guest_abc" }));
    });
  });

  it("ホスト引き継ぎ時に emitToRoom の引数が正しい", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue({ id: "room-1", status: "open" } as never);
    mockFindFirst.mockResolvedValue({ id: "participant-1", isHost: true } as never);

    const now = new Date();
    const leaveMsg = {
      id: "leave-msg-1",
      content: "user-1-nameさんが退室しました",
      createdAt: now,
    };
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
    mockTx.chatMessage.create
      .mockResolvedValueOnce(leaveMsg)
      .mockResolvedValueOnce(systemMsg);

    await POST(makeRequest(), makeParams());

    // 1: 退室chat:message, 2: room:user_left, 3: ホスト変更chat:message, 4: room:host_changed
    expect(mockEmitToRoom).toHaveBeenNthCalledWith(3, "chat:message", "room-1", {
      id: "msg-1",
      roomId: "room-1",
      user: null,
      content: "new-userさんがホストになりました",
      isSystem: true,
      createdAt: now,
    });
    expect(mockEmitToRoom).toHaveBeenNthCalledWith(4, "room:host_changed", "room-1", {
      newHostId: "user-2",
      newHostUsername: "new-user",
    });
  });
});
