export type BlockEntry = {
  blockedId: string;
  username: string;
  iconUrl: string | null;
  createdAt: string;
};

export async function fetchMyBlocks(): Promise<{ data: BlockEntry[] }> {
  const res = await fetch("/api/v1/users/me/blocks", { credentials: "include" });
  if (!res.ok) throw new Error("ブロックリストの取得に失敗しました");
  return res.json() as Promise<{ data: BlockEntry[] }>;
}

export async function blockUser(userId: string): Promise<void> {
  const res = await fetch("/api/v1/users/me/blocks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ userId }),
  });
  if (!res.ok) {
    const body = (await res.json()) as { error?: { code: string; message: string } };
    throw new Error(body.error?.message ?? "ブロックに失敗しました");
  }
}

export async function unblockUser(userId: string): Promise<void> {
  const res = await fetch(`/api/v1/users/me/blocks/${userId}`, {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const body = (await res.json()) as { error?: { code: string; message: string } };
    throw new Error(body.error?.message ?? "ブロック解除に失敗しました");
  }
}

export type ReportInput = {
  targetUserId?: string;
  targetMessageId?: string;
  reason: string;
  detail?: string;
};

export async function createReport(input: ReportInput): Promise<void> {
  const res = await fetch("/api/v1/reports", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const body = (await res.json()) as { error?: { code: string; message: string } };
    throw new Error(body.error?.message ?? "通報に失敗しました");
  }
}
