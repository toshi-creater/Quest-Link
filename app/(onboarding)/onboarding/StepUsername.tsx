"use client";

import { OnboardingNavButtons } from "./OnboardingNavButtons";

interface StepUsernameProps {
  username: string;
  onUsernameChange: (value: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const inputStyle = {
  backgroundColor: "var(--bg-input)",
  borderColor: "var(--border)",
  color: "var(--text-primary)",
};

export function StepUsername({ username, onUsernameChange, onNext, onBack }: StepUsernameProps) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (username.trim()) onNext();
      }}
      className="animate-fade-in-up flex flex-col min-h-[38rem] space-y-10"
    >
      <div className="space-y-8">
        <div>
          <h1 className="mb-1 text-2xl sm:text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
            ユーザー名を決めましょう
          </h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-secondary)" }}>
            あなたを表す名前を設定してください。後から変更できます。
          </p>
        </div>

        <div>
          <label
            className="mb-1.5 block text-sm font-medium"
            style={{ color: "var(--text-primary)" }}
          >
            ユーザー名 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            maxLength={50}
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
            className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)] transition-colors"
            style={inputStyle}
          />
          <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
            ユーザー名は後からいつでも変更できます
          </p>
        </div>
      </div>

      <OnboardingNavButtons
        primaryLabel="次へ"
        primaryType="submit"
        primaryDisabled={username.trim() === ""}
        onBack={onBack}
      />
    </form>
  );
}
