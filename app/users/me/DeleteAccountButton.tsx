"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";

export function DeleteAccountButton() {
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex gap-3">
        <button
          onClick={() => setConfirming(false)}
          className="rounded-xl border px-4 py-2 text-sm transition-all hover:opacity-80"
          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
        >
          キャンセル
        </button>
        <button
          className="rounded-xl border border-red-500/50 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-400 transition-all hover:bg-red-500/30"
        >
          本当に削除する
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center gap-2 rounded-xl border border-red-500/30 px-4 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10"
    >
      <Trash2 className="h-4 w-4" />
      アカウントを削除する
    </button>
  );
}
