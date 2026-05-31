"use client";

import { createPortal } from "react-dom";
import { CircleNotch } from "@phosphor-icons/react";

type Props = {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
};

export function ConfirmModal({ title, description, confirmLabel, onConfirm, onCancel, isPending }: Props) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-5 animate-scale-in"
        style={{ backgroundColor: "var(--bg-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1">
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            {title}
          </h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {description}
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="flex flex-1 items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition-all hover:opacity-80 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ color: "var(--text-secondary)", backgroundColor: "var(--bg-card-hover)" }}
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "rgba(239,68,68,0.05)" }}
          >
            {isPending ? <CircleNotch className="h-4 w-4 animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
