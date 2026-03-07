"use client";

import { useRouter } from "next/navigation";
import { X } from "lucide-react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export function LoginModal({ isOpen, onClose }: Props) {
  const router = useRouter();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl p-6"
        style={{
          backgroundColor: "var(--bg-card)",
          border: "1px solid var(--border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 transition-colors hover:text-white"
          style={{ color: "var(--text-secondary)" }}
          aria-label="閉じる"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 text-center">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl text-2xl"
            style={{ backgroundColor: "rgba(124,58,237,0.15)" }}
          >
            🔐
          </div>
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            ログインが必要です
          </h2>
          <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
            この機能を利用するにはログインしてください
          </p>
        </div>

        <button
          onClick={() => router.push("/login")}
          className="w-full rounded-xl py-3 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-95"
          style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-light))" }}
        >
          ログインして続ける
        </button>
      </div>
    </div>
  );
}
