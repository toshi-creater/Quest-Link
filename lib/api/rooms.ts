// ─── 型定義 ──────────────────────────────────────────────────────────────────

export type RoomGame = {
  id: string;
  name: string;
  coverImageUrl: string | null;
};

export type RoomHost = {
  id: string;
  username: string;
  iconUrl: string | null;
  avgRating: number;
};

export type RoomTag = {
  id: string;
  name: string;
  slug: string;
  category: { id: string; name: string; slug: string } | null;
};

export type RoomParticipant = {
  userId: string | null;
  guestSessionId: string | null;
  username: string;
  iconUrl: string | null;
  avgRating: number | null;
  isHost: boolean;
  joinedAt: string;
};

export type RoomSummary = {
  id: string;
  title: string;
  description: string | null;
  game: RoomGame;
  maxPlayers: number;
  currentPlayers: number;
  status: "waiting" | "playing" | "closed";
  playStyleTags: RoomTag[];
  host: RoomHost | null;
  createdAt: string;
};

export type RoomDetail = RoomSummary & {
  description: string | null;
  participants: RoomParticipant[];
  closedAt: string | null;
  isCurrentGuestParticipant: boolean;
  currentGuestSessionId: string | null;
};

export type RoomsListResponse = {
  data: RoomSummary[];
  meta: { total: number; page: number; limit: number };
};

export type RoomDetailResponse = {
  data: RoomDetail;
};

export type CreateRoomInput = {
  title: string;
  gameId: string;
  maxPlayers: number;
  description?: string;
  playStyleTagIds?: string[];
};

// ─── API フェッチ関数 ─────────────────────────────────────────────────────────

export async function fetchRooms(params?: {
  status?: string;
  gameId?: string;
  tagSlugs?: string;
  q?: string;
  page?: number;
  limit?: number;
}): Promise<RoomsListResponse> {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.gameId) searchParams.set("gameId", params.gameId);
  if (params?.tagSlugs) searchParams.set("tagSlugs", params.tagSlugs);
  if (params?.q) searchParams.set("q", params.q);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));

  const query = searchParams.toString();
  const res = await fetch(`/api/v1/rooms${query ? `?${query}` : ""}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("部屋一覧の取得に失敗しました");
  return res.json() as Promise<RoomsListResponse>;
}

export async function fetchRoom(roomId: string): Promise<RoomDetailResponse> {
  const res = await fetch(`/api/v1/rooms/${roomId}`, {
    credentials: "include",
  });
  if (!res.ok) throw new Error("部屋情報の取得に失敗しました");
  return res.json() as Promise<RoomDetailResponse>;
}

export async function createRoom(input: CreateRoomInput): Promise<RoomDetailResponse> {
  const res = await fetch("/api/v1/rooms", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = (await res.json()) as { error?: { code: string; message: string } };
    throw new Error(body.error?.message ?? "部屋の作成に失敗しました");
  }
  return res.json() as Promise<RoomDetailResponse>;
}

export async function closeRoom(roomId: string): Promise<void> {
  const res = await fetch(`/api/v1/rooms/${roomId}/close`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const body = (await res.json()) as { error?: { code: string; message: string } };
    throw new Error(body.error?.message ?? "部屋の解散に失敗しました");
  }
}

export type JoinRoomResponse = {
  data: {
    roomId: string;
    userId: string;
    isHost: boolean;
    joinedAt: string;
  };
};

export async function joinRoom(roomId: string): Promise<JoinRoomResponse> {
  const res = await fetch(`/api/v1/rooms/${roomId}/join`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const body = (await res.json()) as { error?: { code: string; message: string } };
    throw new Error(body.error?.message ?? "部屋への参加に失敗しました");
  }
  return res.json() as Promise<JoinRoomResponse>;
}

export async function leaveRoom(roomId: string): Promise<void> {
  const res = await fetch(`/api/v1/rooms/${roomId}/leave`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const body = (await res.json()) as { error?: { code: string; message: string } };
    throw new Error(body.error?.message ?? "退室に失敗しました");
  }
}

export type CurrentRoomResponse = {
  data: RoomDetail | null;
};

export async function fetchCurrentRoom(): Promise<CurrentRoomResponse> {
  const res = await fetch("/api/v1/rooms/current", {
    credentials: "include",
  });
  if (res.status === 401) return { data: null };
  if (!res.ok) throw new Error("参加中の部屋の取得に失敗しました");
  return res.json() as Promise<CurrentRoomResponse>;
}

export type InviteTokenResponse = {
  data: { inviteToken: string };
};

export async function generateInviteToken(roomId: string): Promise<InviteTokenResponse> {
  const res = await fetch(`/api/v1/rooms/${roomId}/invite`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) {
    const body = (await res.json()) as { error?: { code: string; message: string } };
    throw new Error(body.error?.message ?? "招待リンクの生成に失敗しました");
  }
  return res.json() as Promise<InviteTokenResponse>;
}

export type KickTarget =
  | { userId: string; guestSessionId?: never }
  | { guestSessionId: string; userId?: never };

export async function kickParticipant(roomId: string, target: KickTarget): Promise<void> {
  const res = await fetch(`/api/v1/rooms/${roomId}/kick`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(target),
  });
  if (!res.ok) {
    const body = (await res.json()) as { error?: { code: string; message: string } };
    throw new Error(body.error?.message ?? "キックに失敗しました");
  }
}

