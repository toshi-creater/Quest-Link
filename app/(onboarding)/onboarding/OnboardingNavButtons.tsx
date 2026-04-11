"use client";

import { ArrowLeft, CaretRight } from "@phosphor-icons/react";
import clsx from "clsx";

interface OnboardingNavButtonsProps {
  primaryLabel: string;
  primaryType?: "button" | "submit";
  onPrimary?: () => void;
  primaryDisabled?: boolean;
  showPrimaryIcon?: boolean;
  /** undefined の場合 Back ボタン非表示 */
  onBack?: () => void;
  /**
   * "full"  → w-full py-3.5（StepWelcome: Back なし・全幅）
   * "flex1" → flex-1 py-3  （Steps 2〜5: Back と横並び）
   */
  primaryWidth?: "full" | "flex1";
}

export function OnboardingNavButtons({
  primaryLabel,
  primaryType = "button",
  onPrimary,
  primaryDisabled = false,
  showPrimaryIcon = true,
  onBack,
  primaryWidth = "flex1",
}: OnboardingNavButtonsProps) {
  return (
    <div className="flex items-center gap-3">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex flex-1 items-center justify-center gap-1 rounded-xl border px-4 py-3 text-sm font-medium transition-all hover:opacity-80"
          style={{ borderColor: "var(--border)", color: "var(--text-secondary)" }}
        >
          <ArrowLeft className="h-4 w-4" />
          戻る
        </button>
      )}
      <button
        type={primaryType}
        onClick={onPrimary}
        disabled={primaryDisabled}
        className={clsx(
          "flex items-center justify-center rounded-xl px-6 text-sm font-semibold text-white transition-all hover:opacity-90 disabled:opacity-50",
          showPrimaryIcon && "gap-2",
          primaryWidth === "full" ? "w-full py-3.5" : "flex-1 py-3",
        )}
        style={{
          background: "linear-gradient(135deg, var(--accent), #6d28d9)",
          boxShadow: "0 4px 14px rgba(124,58,237,0.4)",
        }}
      >
        {primaryLabel}
        {showPrimaryIcon && <CaretRight className="h-4 w-4" />}
      </button>
    </div>
  );
}
