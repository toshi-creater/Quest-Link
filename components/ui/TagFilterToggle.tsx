"use client";

import { Funnel, CaretDown } from "@phosphor-icons/react";

type Props = {
  selectedCount: number;
  panelOpen: boolean;
  onPanelToggle: () => void;
  label?: string;
};

export function TagFilterToggle({ selectedCount, panelOpen, onPanelToggle, label = "タグで絞り込み" }: Props) {
  return (
    <button
      type="button"
      onClick={onPanelToggle}
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors"
      style={{
        backgroundColor: panelOpen ? "rgba(124,58,237,0.15)" : "var(--bg-card)",
        color: panelOpen ? "var(--accent-light)" : "var(--text-secondary)",
        border: `1px solid ${panelOpen ? "rgba(124,58,237,0.4)" : "var(--border)"}`,
      }}
    >
      <Funnel className="h-4 w-4" />
      <span>{label}</span>
      {selectedCount > 0 && (
        <span
          className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold"
          style={{ backgroundColor: "var(--accent)", color: "#fff" }}
        >
          {selectedCount}
        </span>
      )}
      <CaretDown
        className="h-4 w-4 transition-transform duration-200"
        style={{ transform: panelOpen ? "rotate(180deg)" : "rotate(0deg)" }}
      />
    </button>
  );
}
