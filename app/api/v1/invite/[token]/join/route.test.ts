import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    room: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    roomParticipant: {
      findFirst: vi.fn(),
    },
    chatMessage: {
      create: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/socket-emitter", () => ({ emitToRoom: vi.fn() }));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { emitToRoom } from "@/lib/socket-emitter";
import { cookies } from "next/headers";
import { POST } from "./route";

const mockRoomFindUnique = vi.mocked(prisma.room.findUnique);
const mockParticipantFindFirst = vi.mocked(prisma.roomParticipant.findFirst);
const mockChatMessageCreate = vi.mocked(prisma.chatMessage.create);
const mockTransaction = vi.mocked(prisma.$transaction);
const mockEmitToRoom = vi.mocked(emitToRoom);
const mockCookies = vi.mocked(cookies);

type MockTx = {
  $queryRaw: ReturnType<typeof vi.fn>;
  roomParticipant: {
    count: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };
  room: {
    update: ReturnType<typeof vi.fn>;
  };
};

let mockTx: MockTx;

const makeRequest = (body: Record<string, unknown> = {}) =>
  new Request("http://localhost/api/v1/invite/valid-token/join", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

const makeParams = (token = "valid-token") => ({
  params: Promise.resolve({ token }),
});

const mockRoom = { id: "room-1", status: "waiting", maxPlayers: 4 };
const mockNow = new Date();

beforeEach(() => {
  vi.clearAllMocks();

  mockTx = {
    $queryRaw: vi.fn().mockResolvedValue([]),
    roomParticipant: {
      count: vi.fn().mockResolvedValue(1),
      create: vi.fn().mockResolvedValue({
        roomId: "room-1",
        guestSessionId: "guest_abc",
        displayName: "TestGuest",
        isHost: false,
        joinedAt: mockNow,
      }),
    },
    room: {
      update: vi.fn().mockResolvedValue({}),
    },
  };

  mockTransaction.mockImplementation(async (fn) => fn(mockTx as never));

  mockCookies.mockResolvedValue({
    get: vi.fn().mockReturnValue(undefined),
  } as never);

  mockChatMessageCreate.mockResolvedValue({
    id: "msg-1",
    roomId: "room-1",
    content: "TestGuestさんが入室しました",
    isSystem: true,
    createdAt: mockNow,
  } as never);
});

describe("POST /api/v1/invite/[token]/join", () => {
  it("トークンが存在しない場合 404 INVITE_NOT_FOUND を返す", async () => {
    mockRoomFindUnique.mockResolvedValue(null);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe("INVITE_NOT_FOUND");
  });

  it("room.status が closed の場合 400 ROOM_CLOSED を返す", async () => {
    mockRoomFindUnique.mockResolvedValue({
      ...mockRoom,
      status: "closed",
    } as never);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("ROOM_CLOSED");
  });

  it("Cookie に既存 guestSessionId が存在する場合 409 ALREADY_JOINED を返す", async () => {
    mockRoomFindUnique.mockResolvedValue(mockRoom as never);
    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "guest_existing" }),
    } as never);
    mockParticipantFindFirst.mockResolvedValue({ id: "participant-1" } as never);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error.code).toBe("ALREADY_JOINED");
  });

  it("同じ Cookie でも別のルームなら参加できる（findFirst が null を返す）", async () => {
    mockRoomFindUnique.mockResolvedValue(mockRoom as never);
    mockCookies.mockResolvedValue({
      get: vi.fn().mockReturnValue({ value: "guest_existing" }),
    } as never);
    mockParticipantFindFirst.mockResolvedValue(null);

    const res = await POST(makeRequest({ displayName: "TestGuest" }), makeParams());

    expect(res.status).toBe(200);
  });

  it("満員の場合 409 ROOM_FULL を返す", async () => {
    mockRoomFindUnique.mockResolvedValue(mockRoom as never);
    mockTx.roomParticipant.count.mockResolvedValue(4);

    const res = await POST(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error.code).toBe("ROOM_FULL");
  });

  it("正常参加（満員にならない）場合 200 と isGuest: true を返す", async () => {
    mockRoomFindUnique.mockResolvedValue(mockRoom as never);
    mockTx.roomParticipant.count.mockResolvedValue(1);

    const res = await POST(makeRequest({ displayName: "TestGuest" }), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.roomId).toBe("room-1");
    expect(body.data.isGuest).toBe(true);
    expect(body.data.guestSessionId).toBeDefined();
    expect(mockTx.room.update).not.toHaveBeenCalled();
  });

  it("正常参加（満員になる）場合 room.update({ status: 'full' }) が呼ばれる", async () => {
    mockRoomFindUnique.mockResolvedValue(mockRoom as never);
    mockTx.roomParticipant.count.mockResolvedValue(3);

    const res = await POST(makeRequest({ displayName: "TestGuest" }), makeParams());

    expect(res.status).toBe(200);
    expect(mockTx.room.update).toHaveBeenCalledWith({
      where: { id: "room-1" },
      data: { status: "full" },
    });
  });

  it("成功時に Cookie quest_link_guest_session が設定される", async () => {
    mockRoomFindUnique.mockResolvedValue(mockRoom as never);

    const res = await POST(makeRequest({ displayName: "TestGuest" }), makeParams());

    expect(res.status).toBe(200);
    const setCookie = res.headers.get("set-cookie");
    expect(setCookie).toContain("quest_link_guest_session=");
    expect(setCookie).toContain("HttpOnly");
  });

  it("成功時に emitToRoom が chat:message と room:user_joined で呼ばれる", async () => {
    mockRoomFindUnique.mockResolvedValue(mockRoom as never);

    await POST(makeRequest({ displayName: "TestGuest" }), makeParams());

    expect(mockEmitToRoom).toHaveBeenCalledTimes(2);
    expect(mockEmitToRoom).toHaveBeenCalledWith(
      "chat:message",
      "room-1",
      expect.objectContaining({ isSystem: true })
    );
    expect(mockEmitToRoom).toHaveBeenCalledWith(
      "room:user_joined",
      "room-1",
      expect.objectContaining({ isGuest: true })
    );
  });

  it("displayName が空の場合、自動生成名が使われる", async () => {
    mockRoomFindUnique.mockResolvedValue(mockRoom as never);

    await POST(makeRequest({ displayName: "" }), makeParams());

    expect(mockTx.roomParticipant.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          displayName: expect.stringMatching(/^Guest\d+$/),
        }),
      })
    );
  });

  it("displayName が 51 文字の場合 400 VALIDATION_ERROR を返す", async () => {
    mockRoomFindUnique.mockResolvedValue(mockRoom as never);

    const res = await POST(
      makeRequest({ displayName: "a".repeat(51) }),
      makeParams()
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("VALIDATION_ERROR");
  });
});
