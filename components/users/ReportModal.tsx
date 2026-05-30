"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { CircleNotch } from "@phosphor-icons/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createReport } from "@/lib/api/users";

const REASON_OPTIONS = [
  { value: "harassment", label: "ハラスメント・嫌がらせ" },
  { value: "spam", label: "スパム" },
  { value: "hate_speech", label: "ヘイトスピーチ・差別的発言" },
  { value: "inappropriate_content", label: "不適切なコンテンツ" },
  { value: "other", label: "その他" },
] as const;

type Props = {
  targetUserId?: string;
  targetMessageId?: string;
  targetName: string;
  onClose: () => void;
};

export function ReportModal({ targetUserId, targetMessageId, targetName, onClose }: Props) {
  const [reason, setReason] = useState<string>("");
  const [detail, setDetail] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: () =>
      createReport({ targetUserId, targetMessageId, reason, detail: detail.trim() || undefined }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["my-blocks"] });
      onClose();
    },
  });

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-5"
        style={{ backgroundColor: "var(--bg-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-1">
          <h2 className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>
            通報する
          </h2>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {targetName} を通報します。理由を選択してください。
          </p>
        </div>

        <div className="space-y-2">
          {REASON_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-3 cursor-pointer rounded-xl px-3 py-2.5 transition-colors hover:bg-[rgba(255,255,255,0.05)]"
            >
              <input
                type="radio"
                name="reason"
                value={opt.value}
                checked={reason === opt.value}
                onChange={(e) => setReason(e.target.value)}
                className="accent-purple-500"
              />
              <span className="text-sm" style={{ color: "var(--text-primary)" }}>
                {opt.label}
              </span>
            </label>
          ))}
        </div>

        {reason === "other" && (
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder="詳細を入力（任意）"
            maxLength={500}
            rows={3}
            className="w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-purple-500"
            style={{
              backgroundColor: "var(--bg-input)",
              borderColor: "var(--border)",
              color: "var(--text-primary)",
            }}
          />
        )}

        {mutation.isError && (
          <p className="text-sm text-red-400">{(mutation.error as Error).message}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={mutation.isPending}
            className="flex flex-1 items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition-all hover:opacity-80 active:scale-[0.97] disabled:opacity-50"
            style={{ color: "var(--text-secondary)", backgroundColor: "var(--bg-card-hover)" }}
          >
            キャンセル
          </button>
          <button
            onClick={() => mutation.mutate()}
            disabled={!reason || mutation.isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: "rgba(239,68,68,0.05)" }}
          >
            {mutation.isPending && <CircleNotch className="h-4 w-4 animate-spin" />}
            通報する
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
