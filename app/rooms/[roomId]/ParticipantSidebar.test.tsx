import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

vi.mock("@/lib/hooks/useMyBlocks", () => ({
  useMyBlocks: () => new Set<string>(),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock("@phosphor-icons/react", () => ({
  Crown: () => <span data-testid="icon-crown" />,
  Users: () => <span data-testid="icon-users" />,
}));

vi.mock("@/components/ui/UserAvatar", () => ({
  UserAvatar: ({ username }: { username: string }) => (
    <div data-testid="user-avatar">{username}</div>
  ),
}));

vi.mock("@/components/ui/StarRating", () => ({
  RatingDisplay: () => <div data-testid="rating-display" />,
}));

vi.mock("@/components/rooms/KickButton", () => ({
  KickButton: ({ targetName }: { targetName: string }) => (
    <button data-testid="kick-button" aria-label={`${targetName}をキック`} />
  ),
}));

import { ParticipantSidebar } from "./ParticipantSidebar";
import type { RoomParticipant } from "@/lib/api/rooms";

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

const defaultProps = {
  roomId: "room-1",
  currentUserId: null as string | null,
  currentGuestSessionId: null as string | null,
  isCurrentUserHost: false,
};

const makeUser = (override: Partial<RoomParticipant> = {}): RoomParticipant => ({
  userId: "user-1",
  guestSessionId: null,
  username: "TestUser",
  iconUrl: null,
  avgRating: null,
  isHost: false,
  joinedAt: "2026-04-12T10:00:00.000Z",
  ...override,
});

const makeGuest = (override: Partial<RoomParticipant> = {}): RoomParticipant => ({
  userId: null,
  guestSessionId: "gs-1",
  username: "GuestUser",
  iconUrl: null,
  avgRating: null,
  isHost: false,
  joinedAt: "2026-04-12T10:00:00.000Z",
  ...override,
});

describe("ParticipantSidebar", () => {
  it("参加者数と最大人数が表示される", () => {
    renderWithQuery(
      <ParticipantSidebar
        {...defaultProps}
        participants={[makeUser()]}
        maxPlayers={4}
        currentPlayers={1}
      />
    );
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("/4")).toBeInTheDocument();
  });

  it("空枠が (maxPlayers - currentPlayers) 個表示される", () => {
    renderWithQuery(
      <ParticipantSidebar
        {...defaultProps}
        participants={[makeUser()]}
        maxPlayers={4}
        currentPlayers={1}
      />
    );
    expect(screen.getAllByText("募集中...")).toHaveLength(3);
  });

  it("ホストには Crown アイコンが表示される", () => {
    renderWithQuery(
      <ParticipantSidebar
        {...defaultProps}
        participants={[makeUser({ isHost: true })]}
        maxPlayers={2}
        currentPlayers={1}
      />
    );
    expect(screen.getByTestId("icon-crown")).toBeInTheDocument();
  });

  it("非ホストには Crown アイコンが表示されない", () => {
    renderWithQuery(
      <ParticipantSidebar
        {...defaultProps}
        participants={[makeUser({ isHost: false })]}
        maxPlayers={2}
        currentPlayers={1}
      />
    );
    expect(screen.queryByTestId("icon-crown")).toBeNull();
  });

  it("ゲスト参加者には「ゲスト」バッジが表示される", () => {
    renderWithQuery(
      <ParticipantSidebar
        {...defaultProps}
        participants={[makeGuest()]}
        maxPlayers={2}
        currentPlayers={1}
      />
    );
    expect(screen.getByText("ゲスト")).toBeInTheDocument();
  });

  it("ユーザー参加者には「ゲスト」バッジが表示されない", () => {
    renderWithQuery(
      <ParticipantSidebar
        {...defaultProps}
        participants={[makeUser()]}
        maxPlayers={2}
        currentPlayers={1}
      />
    );
    expect(screen.queryByText("ゲスト")).toBeNull();
  });

  it("自分のユーザーには「あなた」ラベルが表示される", () => {
    renderWithQuery(
      <ParticipantSidebar
        {...defaultProps}
        participants={[makeUser({ userId: "me" })]}
        maxPlayers={2}
        currentPlayers={1}
        currentUserId="me"
      />
    );
    expect(screen.getByText("(あなた)")).toBeInTheDocument();
  });

  it("自分以外のユーザーには「あなた」ラベルが表示されない", () => {
    renderWithQuery(
      <ParticipantSidebar
        {...defaultProps}
        participants={[makeUser({ userId: "other" })]}
        maxPlayers={2}
        currentPlayers={1}
        currentUserId="me"
      />
    );
    expect(screen.queryByText("(あなた)")).toBeNull();
  });

  it("ユーザー参加者のアバターにプロフィールページへのリンクが付く", () => {
    renderWithQuery(
      <ParticipantSidebar
        {...defaultProps}
        participants={[makeUser({ userId: "user-99" })]}
        maxPlayers={2}
        currentPlayers={1}
      />
    );
    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href") === "/users/user-99")).toBe(true);
  });

  it("自分のアバターのリンク先は /users/me", () => {
    renderWithQuery(
      <ParticipantSidebar
        {...defaultProps}
        participants={[makeUser({ userId: "me" })]}
        maxPlayers={2}
        currentPlayers={1}
        currentUserId="me"
      />
    );
    const links = screen.getAllByRole("link");
    expect(links.every((l) => l.getAttribute("href") === "/users/me")).toBe(true);
  });

  it("参加者がいない場合は空枠のみ表示される", () => {
    renderWithQuery(
      <ParticipantSidebar
        {...defaultProps}
        participants={[]}
        maxPlayers={3}
        currentPlayers={0}
      />
    );
    expect(screen.getAllByText("募集中...")).toHaveLength(3);
    expect(screen.queryByTestId("user-avatar")).toBeNull();
  });
});
