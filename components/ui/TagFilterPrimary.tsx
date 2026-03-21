"use client";

import { ChevronDown } from "lucide-react";
import clsx from "clsx";

export const PRIMARY_TAG_COUNT = 6;

type Tag = {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  category: { id: string; name: string; slug: string } | null;
};

type TagFilterPrimaryProps = {
  tags: Tag[];
  selectedTags: string[];
  onToggle: (slug: string) => void;
  panelOpen: boolean;
  onPanelToggle: () => void;
  extraSelectedCount: number;
};

export function TagFilterPrimary({
  tags,
  selectedTags,
  onToggle,
  panelOpen,
  onPanelToggle,
  extraSelectedCount,
}: TagFilterPrimaryProps) {
  const primaryTags = tags.slice(0, PRIMARY_TAG_COUNT);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {primaryTags.map((tag) => {
        const active = selectedTags.includes(tag.slug);
        return (
          <button
            key={tag.id}
            onClick={() => onToggle(tag.slug)}
            className={clsx("rounded-full px-3 py-1.5 text-xs font-medium transition-all")}
            style={
              active
                ? {
                    backgroundColor: "rgba(124,58,237,0.3)",
                    color: "var(--accent-light)",
                    border: "1px solid rgba(124,58,237,0.6)",
                  }
                : {
                    backgroundColor: "var(--bg-card)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--border)",
                  }
            }
          >
            {tag.name}
          </button>
        );
      })}

      <button
        onClick={onPanelToggle}
        className="relative flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-medium transition-all"
        style={{
          backgroundColor: panelOpen ? "rgba(124,58,237,0.15)" : "var(--bg-card)",
          color: panelOpen ? "var(--accent-light)" : "var(--text-secondary)",
          border: `1px solid ${panelOpen ? "rgba(124,58,237,0.4)" : "var(--border)"}`,
        }}
      >
        すべて表示
        {extraSelectedCount > 0 && !panelOpen && (
          <span
            className="flex h-4 min-w-[1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none"
            style={{ backgroundColor: "var(--accent)", color: "#fff" }}
          >
            {extraSelectedCount}
          </span>
        )}
        <ChevronDown
          className={clsx("h-3 w-3 transition-transform duration-200", panelOpen && "rotate-180")}
        />
      </button>
    </div>
  );
}
