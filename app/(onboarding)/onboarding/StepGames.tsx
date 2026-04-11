"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import { type Game } from "@/lib/mock-data";
import { GridGamePicker } from "@/components/ui/GamePicker";

interface StepGamesProps {
  selectedGames: Game[];
  onGamesChange: (games: Game[]) => void;
  onBack: () => void;
  onSubmit: () => void;
  saving: boolean;
  error: string | null;
  status: "loading" | "authenticated" | "unauthenticated";
}

export function StepGames({
  selectedGames,
  onGamesChange,
  onBack,
  onSubmit,
  saving,
  error,
  status,
}: StepGamesProps) {
  return (
    <div className="animate-fade-in-up flex flex-col justify-between min-h-[38rem]">
      <div className="space-y-8">
        <div>
          <h1 className="mb-1 text-2xl sm:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            プレイしているゲームを登録
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            プレイするゲームを登録すると、ゲーム仲間が見つかりやすくなります。
          </p>
        </div>

        <GridGamePicker value={selectedGames} onChange={onGamesChange} max={20} />

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex flex-1 items-center justify-center gap-1 rounded-xl border px-4 py-3 text-sm font-medium transition-all hover:opacity-80"
          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          戻る
        </button>
        <button
          type="button"
          disabled={status === "loading" || saving}
          onClick={onSubmit}
          className="flex flex-1 items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50"
          style={{
            background: "linear-gradient(135deg, var(--accent), #6d28d9)",
            boxShadow: "0 4px 14px rgba(124,58,237,0.4)",
          }}
        >
          {saving ? "設定中..." : "はじめる"}
        </button>
      </div>
    </div>
  );
}
