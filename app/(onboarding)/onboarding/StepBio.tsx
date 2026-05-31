"use client";

import { OnboardingNavButtons } from "./OnboardingNavButtons";

interface StepBioProps {
  bio: string;
  onBioChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const inputStyle = {
  backgroundColor: "var(--bg-input)",
  color: "var(--text-primary)",
};

export function StepBio({ bio, onBioChange, onNext, onBack }: StepBioProps) {
  return (
    <div className="animate-fade-in-up flex flex-col min-h-[38rem] space-y-10">
      <div className="space-y-8">
        <div>
          <h1 className="mb-1 text-2xl sm:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            自己紹介を書きましょう
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            プレイスタイルや得意ジャンルを伝えると、仲間が見つかりやすくなります。
          </p>
        </div>

        <div>
          <label
            className="mb-1.5 block text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            自己紹介{" "}
            <span className="text-xs font-normal" style={{ color: "var(--text-muted)" }}>
              （任意・500文字以内）
            </span>
          </label>
          <textarea
            rows={4}
            placeholder="プレイスタイルや得意なゲームについて教えてください..."
            value={bio}
            onChange={(e) => onBioChange(e.target.value)}
            maxLength={500}
            className="w-full resize-none rounded-xl px-4 py-2.5 text-sm outline-none"
            style={inputStyle}
          />
          <p className="mt-1 text-right text-xs" style={{ color: "var(--text-muted)" }}>
            {bio.length}/500
          </p>
        </div>
      </div>

      <OnboardingNavButtons
        primaryLabel="次へ"
        onPrimary={onNext}
        onBack={onBack}
      />
    </div>
  );
}
