"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Tag = {
  id: string;
  name: string;
  slug: string;
};

type ActiveFilterBarProps = {
  selectedTags: string[];
  allTags: Tag[];
  onRemove: (slug: string) => void;
};

export function ActiveFilterBar({
  selectedTags,
  allTags,
  onRemove,
}: ActiveFilterBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    updateScrollState();
    el.addEventListener("scroll", updateScrollState);

    const observer = new ResizeObserver(updateScrollState);
    observer.observe(el);

    return () => {
      el.removeEventListener("scroll", updateScrollState);
      observer.disconnect();
    };
  }, [selectedTags]);

  const selectedTagObjects = selectedTags
    .map((slug) => allTags.find((t) => t.slug === slug))
    .filter((t): t is Tag => t !== undefined);

  const isEmpty = selectedTagObjects.length === 0;

  return (
    <div className="relative min-w-0">
      <div
        ref={scrollRef}
        className="flex flex-nowrap items-center gap-2 overflow-x-auto py-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {isEmpty ? (
          <span
            className="shrink-0 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            タグの選択なし
          </span>
        ) : (
          selectedTagObjects.map((tag) => (
            <span
              key={tag.slug}
              className="animate-scale-in-chip flex shrink-0 items-center gap-1 rounded-full px-3 py-1 text-xs font-medium"
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
          ))
        )}
      </div>

      {canScrollLeft && (
        <button
          onClick={() =>
            scrollRef.current?.scrollBy({ left: -120, behavior: "smooth" })
          }
          className="absolute left-0 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full transition-opacity hover:opacity-100"
          style={{
            width: "28px",
            height: "28px",
            backgroundColor: "rgba(255,255,255,0.75)",
            color: "rgba(0,0,0,0.7)",
            opacity: 0.9,
          }}
          aria-label="左にスクロール"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      )}

      {canScrollRight && (
        <button
          onClick={() =>
            scrollRef.current?.scrollBy({ left: 120, behavior: "smooth" })
          }
          className="absolute right-0 top-1/2 z-10 flex -translate-y-1/2 items-center justify-center rounded-full transition-opacity hover:opacity-100"
          style={{
            width: "28px",
            height: "28px",
            backgroundColor: "rgba(255,255,255,0.75)",
            color: "rgba(0,0,0,0.7)",
            opacity: 0.9,
          }}
          aria-label="右にスクロール"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
