import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("sonner", () => {
  const toastFn = vi.fn();
  toastFn.success = vi.fn();
  toastFn.error = vi.fn();
  return { toast: toastFn };
});

import { toast as sonnerToast } from "sonner";

// グローバルモック（vitest.setup.ts）を回避して実体を直接テスト
const { toast } = await vi.importActual<typeof import("./toast")>("./toast");

const mockSonner = sonnerToast as unknown as {
  success: ReturnType<typeof vi.fn>;
  error: ReturnType<typeof vi.fn>;
} & ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
});

describe("toast wrapper", () => {
  describe("toast.success", () => {
    it("sonnerToast.success にメッセージを委譲する", () => {
      toast.success("保存しました");
      expect(mockSonner.success).toHaveBeenCalledWith("保存しました");
    });

    it("sonnerToast.success は1回だけ呼ばれる", () => {
      toast.success("test");
      expect(mockSonner.success).toHaveBeenCalledTimes(1);
    });
  });

  describe("toast.error", () => {
    it("sonnerToast.error にメッセージを委譲する", () => {
      toast.error("エラーが発生しました");
      expect(mockSonner.error).toHaveBeenCalledWith("エラーが発生しました");
    });

    it("sonnerToast.error は1回だけ呼ばれる", () => {
      toast.error("test");
      expect(mockSonner.error).toHaveBeenCalledTimes(1);
    });
  });

  describe("toast.info", () => {
    it("sonnerToast 本体（デフォルト呼び出し）にメッセージを委譲する", () => {
      toast.info("あなたがホストになりました");
      expect(mockSonner).toHaveBeenCalledWith("あなたがホストになりました");
    });

    it("sonnerToast は1回だけ呼ばれる", () => {
      toast.info("test");
      expect(mockSonner).toHaveBeenCalledTimes(1);
    });
  });
});
