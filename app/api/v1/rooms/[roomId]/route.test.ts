import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    room: { findUnique: vi.fn() },
  },
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { GET } from "./route";

const mockAuth = vi.mocked(auth);
const mockFindUnique = vi.mocked(prisma.room.findUnique);

const makeRequest = () =>
  new Request("http://localhost/api/v1/rooms/room-1");
const makeParams = () => ({ params: Promise.resolve({ roomId: "room-1" }) });

const makeRoom = () => ({
  id: "room-1",
  title: "テストルーム",
  description: "説明文",
  maxPlayers: 4,
  status: "open",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  closedAt: null,
  game: {
    id: "game-1",
    igdbId: 12345,
    name: "Test Game",
    coverImageUrl: "https://example.com/cover.jpg",
  },
  host: {
    id: "user-1",
    username: "hostUser",
    iconUrl: null,
    avgRating: null,
  },
  playStyleTags: [],
  participants: [
    {
      userId: "user-1",
      isHost: true,
      joinedAt: new Date("2026-01-01T00:00:00Z"),
      user: { username: "hostUser", iconUrl: null, avgRating: null },
    },
    {
      userId: "user-2",
      isHost: false,
      joinedAt: new Date("2026-01-01T00:01:00Z"),
      user: { username: "guestUser", iconUrl: null, avgRating: null },
    },
  ],
});

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GET /api/v1/rooms/[roomId]", () => {
  it("未認証の場合 401 UNAUTHORIZED を返す", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await GET(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error.code).toBe("UNAUTHORIZED");
  });

  it("room が存在しない場合 404 ROOM_NOT_FOUND を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue(null);

    const res = await GET(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.error.code).toBe("ROOM_NOT_FOUND");
  });

  it("正常取得の場合 200 を返し participants が 2 件含まれる", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue(makeRoom() as never);

    const res = await GET(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.participants).toHaveLength(2);
  });

  it("レスポンスの形が仕様通りであり currentPlayers が participants.length に一致する", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockFindUnique.mockResolvedValue(makeRoom() as never);

    const res = await GET(makeRequest(), makeParams());
    const body = await res.json();

    expect(res.status).toBe(200);
    const { data } = body;
    expect(data.id).toBe("room-1");
    expect(data.title).toBe("テストルーム");
    expect(data.currentPlayers).toBe(data.participants.length);
    expect(data.participants[0]).toMatchObject({
      userId: "user-1",
      username: "hostUser",
      isHost: true,
    });
    expect(data.participants[1]).toMatchObject({
      userId: "user-2",
      username: "guestUser",
      isHost: false,
    });
  });
});
