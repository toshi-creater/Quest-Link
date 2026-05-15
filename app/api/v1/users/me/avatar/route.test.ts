import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { update: vi.fn() },
  },
}));

const { mockUpload, mockGetPublicUrl, mockFrom } = vi.hoisted(() => ({
  mockUpload: vi.fn(),
  mockGetPublicUrl: vi.fn(),
  mockFrom: vi.fn(),
}));

vi.mock("@/lib/supabase", () => ({
  getSupabaseClient: vi.fn(() => ({
    storage: { from: mockFrom },
  })),
  AVATAR_BUCKET: "avatar_images",
}));

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { POST } from "./route";

const mockAuth = vi.mocked(auth);
const mockUserUpdate = vi.mocked(prisma.user.update);

const makeFile = (name = "avatar.png", type = "image/png", sizeBytes = 1024) =>
  new File([new Uint8Array(sizeBytes)], name, { type });

// request.formData() を直接モックして jsdom のマルチパート解析を回避する
const makeRequest = (file?: File) => {
  const formData = new FormData();
  if (file) formData.append("file", file);
  return {
    formData: () => Promise.resolve(formData),
  } as unknown as Request;
};

beforeEach(() => {
  vi.clearAllMocks();
  mockFrom.mockReturnValue({
    upload: mockUpload,
    getPublicUrl: mockGetPublicUrl,
  });
});

describe("POST /api/v1/users/me/avatar", () => {
  it("未認証の場合 401 UNAUTHORIZED を返す", async () => {
    mockAuth.mockResolvedValue(null);

    const res = await POST(makeRequest(makeFile()));
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBe("UNAUTHORIZED");
  });

  it("ファイルが含まれない場合 400 FILE_REQUIRED を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);

    const res = await POST(makeRequest());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("FILE_REQUIRED");
  });

  it("許可されていない MIME タイプの場合 400 INVALID_FILE_TYPE を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);

    const res = await POST(makeRequest(makeFile("doc.pdf", "application/pdf")));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("INVALID_FILE_TYPE");
  });

  it("5MB 超のファイルの場合 400 FILE_TOO_LARGE を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    const oversizedFile = makeFile("big.png", "image/png", 5 * 1024 * 1024 + 1);

    const res = await POST(makeRequest(oversizedFile));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBe("FILE_TOO_LARGE");
  });

  it("Supabase アップロード失敗の場合 500 UPLOAD_FAILED を返す", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockUpload.mockResolvedValue({ error: { message: "Bucket not found" } });

    const res = await POST(makeRequest(makeFile()));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.error).toBe("UPLOAD_FAILED");
  });

  it("正常アップロードの場合 200 と iconUrl を返し DB を更新する", async () => {
    mockAuth.mockResolvedValue({ user: { id: "user-1" } } as never);
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: "https://example.supabase.co/storage/v1/object/public/avatar_images/user-1/avatar.png" },
    });
    mockUserUpdate.mockResolvedValue({ id: "user-1" } as never);

    const res = await POST(makeRequest(makeFile()));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data.iconUrl).toContain("user-1/avatar.png");
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "user-1" },
        data: { iconUrl: expect.stringContaining("user-1/avatar.png") },
      })
    );
  });

  it("アップロード時にユーザー ID をパスに含める", async () => {
    mockAuth.mockResolvedValue({ user: { id: "abc-123" } } as never);
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl.mockReturnValue({
      data: { publicUrl: "https://example.supabase.co/storage/v1/object/public/avatar_images/abc-123/avatar.png" },
    });
    mockUserUpdate.mockResolvedValue({ id: "abc-123" } as never);

    await POST(makeRequest(makeFile("photo.png", "image/png")));

    expect(mockFrom).toHaveBeenCalledWith("avatar_images");
    expect(mockUpload).toHaveBeenCalledWith(
      "abc-123/avatar.png",
      expect.any(Uint8Array),
      expect.objectContaining({ contentType: "image/png", upsert: true })
    );
  });
});
