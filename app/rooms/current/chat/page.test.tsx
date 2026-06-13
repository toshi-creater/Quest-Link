import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: vi.fn().mockImplementation(() => {
    throw new Error("NEXT_REDIRECT");
  }),
}));
vi.mock("next/headers", () => ({ cookies: vi.fn() }));
vi.mock("@/lib/prisma", () => ({
  prisma: { roomParticipant: { findFirst: vi.fn() } },
}));

import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import CurrentRoomChatPage from "./page";

const mockAuth = vi.mocked(auth);
const mockRedirect = vi.mocked(redirect);
const mockCookies = vi.mocked(cookies);
const mockFindFirst = vi.mocked(prisma.roomParticipant.findFirst);

function setupCookies(guestSessionId: string | null) {
  mockCookies.mockResolvedValue({
    get: vi.fn().mockReturnValue(guestSessionId ? { value: guestSessionId } : undefined),
  } as never);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(null as never);
  setupCookies(null);
});

describe("CurrentRoomChatPage", () => {
  describe("認証チェック", () => {
    it("userId・guestSessionId が両方なければ /login へリダイレクトする", async () => {
      await expect(CurrentRoomChatPage()).rejects.toThrow("NEXT_REDIRECT");
      expect(mockRedirect).toHaveBeenCalledWith("/login");
    });
  });

  describe("ログイン済みユーザー", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    });

    it("参加中の部屋がある場合 /rooms/{roomId}/chat へリダイレクトする", async () => {
      mockFindFirst.mockResolvedValue({ roomId: "room-abc" } as never);
      await expect(CurrentRoomChatPage()).rejects.toThrow("NEXT_REDIRECT");
      expect(mockRedirect).toHaveBeenCalledWith("/rooms/room-abc/chat");
    });

    it("参加中の部屋がない場合「参加中の部屋がありません」を表示する", async () => {
      mockFindFirst.mockResolvedValue(null);
      render(await CurrentRoomChatPage());
      expect(screen.getByText("参加中の部屋がありません")).toBeTruthy();
    });

    it("userId で roomParticipant を検索する", async () => {
      mockFindFirst.mockResolvedValue(null);
      await CurrentRoomChatPage();
      expect(mockFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ userId: "user-1" }) })
      );
    });
  });

  describe("ゲストセッション", () => {
    beforeEach(() => {
      setupCookies("guest_abc123");
    });

    it("参加中の部屋がある場合 /rooms/{roomId}/chat へリダイレクトする", async () => {
      mockFindFirst.mockResolvedValue({ roomId: "room-abc" } as never);
      await expect(CurrentRoomChatPage()).rejects.toThrow("NEXT_REDIRECT");
      expect(mockRedirect).toHaveBeenCalledWith("/rooms/room-abc/chat");
    });

    it("参加中の部屋がない場合「参加中の部屋がありません」を表示する", async () => {
      mockFindFirst.mockResolvedValue(null);
      render(await CurrentRoomChatPage());
      expect(screen.getByText("参加中の部屋がありません")).toBeTruthy();
    });

    it("guestSessionId で roomParticipant を検索する", async () => {
      mockFindFirst.mockResolvedValue(null);
      await CurrentRoomChatPage();
      expect(mockFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ guestSessionId: "guest_abc123" }),
        })
      );
    });
  });
});
