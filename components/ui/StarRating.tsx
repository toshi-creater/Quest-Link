"use client";

import { useState } from "react";
import { Star } from "lucide-react";
import clsx from "clsx";

type Props = {
  value: number | null;
  onChange?: (score: number) => void;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
};

const sizeMap = {
  sm: "h-3.5 w-3.5",
  md: "h-5 w-5",
  lg: "h-7 w-7",
};

export function StarRating({ value, onChange, readonly = false, size = "md" }: Props) {
  const [hovered, setHovered] = useState<number | null>(null);
  const starSize = sizeMap[size];
  const display = hovered ?? value ?? 0;

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          onClick={() => !readonly && onChange?.(star)}
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(null)}
          className={clsx(
            "transition-transform",
            !readonly && "cursor-pointer hover:scale-110",
            readonly && "cursor-default"
          )}
          aria-label={`${star}星`}
        >
          <Star
            className={clsx(starSize, "transition-colors")}
            style={{
              fill: star <= display ? "#eab308" : "transparent",
              color: star <= display ? "#eab308" : "var(--text-muted)",
            }}
          />
        </button>
      ))}
    </div>
  );
}

type DisplayProps = {
  avgRating: number | null;
  ratingCount: number;
  size?: "sm" | "md";
};

export function RatingDisplay({ avgRating, ratingCount, size = "md" }: DisplayProps) {
  if (ratingCount === 0 || avgRating === null) {
    return (
      <span
        className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium"
        style={{ backgroundColor: "rgba(34,197,94,0.15)", color: "#4ade80" }}
      >
        NEW
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1.5">
      <Star
        className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"}
        style={{ fill: "#eab308", color: "#eab308" }}
      />
      <span
        className={clsx("font-semibold", size === "sm" ? "text-xs" : "text-sm")}
        style={{ color: "#eab308" }}
      >
        {avgRating.toFixed(1)}
      </span>
      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
        / {ratingCount}件
      </span>
    </div>
  );
}
