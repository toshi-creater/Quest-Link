"use client";

import { type Game } from "@/lib/mock-data";
import { GridGamePicker } from "@/components/ui/GamePicker";
import { OnboardingNavButtons } from "./OnboardingNavButtons";

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

      <OnboardingNavButtons
        primaryLabel={saving ? "設定中..." : "はじめる"}
        onPrimary={onSubmit}
        primaryDisabled={status === "loading" || saving}
        showPrimaryIcon={false}
        onBack={onBack}
      />
    </div>
  );
}
