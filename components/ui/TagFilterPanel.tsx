"use client";

import { useRef, useEffect } from "react";
import clsx from "clsx";

type Tag = {
  id: string;
  name: string;
  slug: string;
  displayOrder: number;
  category: { id: string; name: string; slug: string } | null;
};

type TagFilterPanelProps = {
  tags: Tag[];
  selectedTags: string[];
  onToggle: (slug: string) => void;
  open: boolean;
  onApply?: () => void;
  applyLabel?: string;
  onClickOutside?: () => void;
};

export function TagFilterPanel({ tags, selectedTags, onToggle, open, onApply, applyLabel, onClickOutside }: TagFilterPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClickOutside?.();
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open, onClickOutside]);

  if (!open) return null;

  const categoryMap = new Map<string, { name: string; tags: Tag[] }>();
  const uncategorized: Tag[] = [];

  for (const tag of tags) {
    if (!tag.category) {
      uncategorized.push(tag);
      continue;
    }
    const key = tag.category.slug;
    if (!categoryMap.has(key)) {
      categoryMap.set(key, { name: tag.category.name, tags: [] });
    }
    categoryMap.get(key)!.tags.push(tag);
  }

  if (uncategorized.length > 0) {
    categoryMap.set("__uncategorized__", { name: "その他", tags: uncategorized });
  }

  return (
    <div
      ref={panelRef}
      className="animate-slide-down mt-2 rounded-xl border p-4"
      style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
    >
      <div className="flex flex-col gap-4">
        {Array.from(categoryMap.entries()).map(([key, { name, tags: catTags }]) => (
          <div key={key}>
            <p className="mb-2 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              {name}
            </p>
            <div className="flex flex-wrap gap-2">
              {catTags.map((tag) => {
                const active = selectedTags.includes(tag.slug);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => onToggle(tag.slug)}
                    className={clsx(
                      "rounded-full px-3 py-1.5 text-xs font-medium transition-all min-h-[2rem]"
                    )}
                    style={
                      active
                        ? {
                            backgroundColor: "rgba(124,58,237,0.3)",
                            color: "var(--accent-light)",
                            border: "1px solid rgba(124,58,237,0.6)",
                          }
                        : {
                            backgroundColor: "var(--bg-card-hover)",
                            color: "var(--text-secondary)",
                            border: "1px solid var(--border)",
                          }
                    }
                  >
                    {tag.name}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {onApply && (
        <div className="mt-6 flex justify-start">
          <button
            type="button"
            onClick={onApply}
            className="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97]"
            style={{ background: "linear-gradient(135deg, var(--accent), #6d28d9)" }}
          >
            {applyLabel ?? "絞り込む"}
          </button>
        </div>
      )}
    </div>
  );
}
