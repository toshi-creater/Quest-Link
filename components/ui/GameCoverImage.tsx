"use client";

import { memo, useState } from "react";
import Image from "next/image";
import { GameController } from "@phosphor-icons/react";
import clsx from "clsx";

type GameCoverImageProps = {
  coverImageUrl: string | null;
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  priority?: boolean;
};

const coverSizes = {
  sm: "h-10 w-8",
  md: "h-14 w-11",
  lg: "h-24 w-18",
};

const iconSizes = {
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-8 w-8",
};

/**
 * ゲームカバー画像コンポーネント。
 *
 * - `size` を指定するとその固定サイズで表示（GamePicker 内など）
 * - `size` を省略すると親の relative コンテナを埋める absolute モードになる
 *   （GamesGrid / HomeGameGrid のグリッドセル内で使用）
 * - `coverImageUrl` が null または画像ロードに失敗した場合は GameController アイコンをフォールバック表示
 */
export const GameCoverImage = memo(function GameCoverImage({
  coverImageUrl,
  name,
  size,
  className,
  priority = false,
}: GameCoverImageProps) {
  const [error, setError] = useState(false);

  if (size) {
    const sizeClass = coverSizes[size];

    if (!coverImageUrl || error) {
      return (
        <div
          className={clsx(
            "flex shrink-0 items-center justify-center rounded-md",
            sizeClass,
            className
          )}
          style={{
            backgroundColor: "rgba(124,58,237,0.15)",
            border: "1px solid rgba(124,58,237,0.2)",
          }}
          title={name}
        >
          <GameController className={iconSizes[size]} style={{ color: "var(--accent-light)" }} />
        </div>
      );
    }

    return (
      <div className={clsx("relative shrink-0 overflow-hidden rounded-md", sizeClass, className)}>
        <Image
          src={coverImageUrl}
          alt={name}
          fill
          className="object-cover"
          sizes="64px"
          priority={priority}
          onError={() => setError(true)}
        />
      </div>
    );
  }

  // fill モード: 親の relative コンテナを absolute inset-0 で埋める
  return (
    <div className={clsx("absolute inset-0", className)}>
      {!coverImageUrl || error ? (
        <div
          className="flex h-full w-full items-center justify-center"
          style={{ background: "var(--bg-card-hover)" }}
        >
          <GameController className="h-8 w-8 opacity-40" style={{ color: "var(--accent)" }} />
        </div>
      ) : (
        <Image
          src={coverImageUrl}
          alt={name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 20vw"
          priority={priority}
          onError={() => setError(true)}
        />
      )}
    </div>
  );
});
