import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    room: { findUnique: vi.fn(), update: vi.fn() },
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { POST } from "./route";

const mockAuth = vi.mocked(auth);
const mockFindUnique = vi.mocked(prisma.room.findUnique);
const mockUpdate = vi.mocked(prisma.room.update);

const makePostRequest = () =>
  new Request("http://localhost/api/v1/rooms/room-1/invite", { method: "POST" });
const makeParams = () => ({ params: Promise.resolve({ roomId: "room-1" }) });

beforeEach(() => {
  vi.clearAllMocks();
});

describe("POST /api/v1/rooms/[roomId]/invite", () => {
  it("未認証の場合 401 UNAUTHORIZED を返す", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makePostRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("room が存在しない場合 404 ROOM_NOT_FOUND を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue(null);

    const res = await POST(makePostRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe("ROOM_NOT_FOUND");
  });

  it("ホスト以外のユーザーの場合 403 FORBIDDEN を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue({
      id: "room-1",
      hostId: "other-user",
      status: "waiting",
      inviteToken: null,
    } as never);

    const res = await POST(makePostRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.error.code).toBe("FORBIDDEN");
  });

  it("closed な部屋の場合 400 ROOM_CLOSED を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue({
      id: "room-1",
      hostId: "user-1",
      status: "closed",
      inviteToken: null,
    } as never);

    const res = await POST(makePostRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe("ROOM_CLOSED");
  });

  it("既存トークンがある場合は新規生成せずそのまま返す（冪等）", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue({
      id: "room-1",
      hostId: "user-1",
      status: "waiting",
      inviteToken: "existing-token",
    } as never);

    const res = await POST(makePostRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.inviteToken).toBe("existing-token");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("トークンが未生成の場合は新規生成して返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue({
      id: "room-1",
      hostId: "user-1",
      status: "waiting",
      inviteToken: null,
    } as never);
    mockUpdate.mockResolvedValue({ inviteToken: "a".repeat(64) } as never);

    const res = await POST(makePostRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.inviteToken).toMatch(/^[0-9a-f]{64}$/);
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "room-1" },
        data: expect.objectContaining({ inviteToken: expect.stringMatching(/^[0-9a-f]{64}$/) }),
      })
    );
  });
});

