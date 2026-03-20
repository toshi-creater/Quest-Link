import { memo } from "react";
import clsx from "clsx";

type Props = {
  tag: { id: string; name: string; slug: string };
  size?: "sm" | "md";
  className?: string;
};

export const PlayStyleTag = memo(function PlayStyleTag({ tag, size = "md", className }: Props) {
  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-xs",
        className
      )}
      style={{
        backgroundColor: "rgba(124,58,237,0.15)",
        color: "var(--accent-light)",
        border: "1px solid rgba(124,58,237,0.3)",
      }}
    >
      {tag.name}
    </span>
  );
});
