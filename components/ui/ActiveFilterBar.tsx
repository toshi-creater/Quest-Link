"use client";

import { X } from "lucide-react";

type Tag = {
  id: string;
  name: string;
  slug: string;
};

type ActiveFilterBarProps = {
  selectedTags: string[];
  allTags: Tag[];
  onRemove: (slug: string) => void;
  onClearAll: () => void;
};

export function ActiveFilterBar({
  selectedTags,
  allTags,
  onRemove,
  onClearAll,
}: ActiveFilterBarProps) {
  if (selectedTags.length === 0) return null;

  const selectedTagObjects = selectedTags
    .map((slug) => allTags.find((t) => t.slug === slug))
    .filter((t): t is Tag => t !== undefined);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      {selectedTagObjects.map((tag) => (
        <span
          key={tag.slug}
          className="animate-scale-in-chip flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
          style={{
            backgroundColor: "rgba(124,58,237,0.2)",
            color: "var(--accent-light)",
            border: "1px solid rgba(124,58,237,0.5)",
          }}
        >
          {tag.name}
          <button
            onClick={() => onRemove(tag.slug)}
            className="flex h-3.5 w-3.5 items-center justify-center rounded-full transition-opacity hover:opacity-70"
            aria-label={`${tag.name}を解除`}
          >
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}

      <button
        onClick={onClearAll}
        className="text-xs transition-opacity hover:opacity-70"
        style={{ color: "var(--text-muted)" }}
      >
        すべてクリア
      </button>
    </div>
  );
}
