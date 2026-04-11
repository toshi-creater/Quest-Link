"use client";

import { Check, CaretRight } from "@phosphor-icons/react";

interface StepWelcomeProps {
  onNext: () => void;
}

const valueProps = [
  "プレイしているゲームで相性の良い仲間を探せる",
  "評価システムで安心して知らない人と組める",
  "部屋作成・参加は30秒でできる",
];

export function StepWelcome({ onNext }: StepWelcomeProps) {
  return (
    <div className="animate-fade-in-up flex flex-col min-h-[38rem] space-y-12">
      <div className="space-y-10">
        <div>
          <h1
            className="mb-3 text-3xl font-bold leading-snug"
            style={{ color: "var(--text-primary)" }}
          >
            今すぐ、ゲーム仲間と<br />繋がろう
          </h1>
          <p className="text-base" style={{ color: "var(--text-secondary)" }}>
            知らない人と安心して組める、ゲーマー向けマッチングプラットフォーム。
          </p>
        </div>

        <ul className="space-y-4">
          {valueProps.map((prop) => (
            <li key={prop} className="flex items-start gap-3">
              <span
                className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full"
                style={{ backgroundColor: "rgba(124,58,237,0.25)" }}
              >
                <Check className="h-3 w-3" style={{ color: "var(--accent-light)" }} />
              </span>
              <span className="text-sm" style={{ color: "var(--text-secondary)" }}>
                {prop}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={onNext}
        className="flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-semibold text-white transition-all hover:opacity-90"
        style={{
          background: "linear-gradient(135deg, var(--accent), #6d28d9)",
          boxShadow: "0 4px 14px rgba(124,58,237,0.4)",
        }}
      >
        次へ
        <CaretRight className="h-4 w-4" />
      </button>
    </div>
  );
}
