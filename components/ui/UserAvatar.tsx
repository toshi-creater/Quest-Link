"use client";

import { memo, useState } from "react";
import Image from "next/image";
import clsx from "clsx";

type Props = {
  username: string;
  iconUrl: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
};

const sizeClasses = {
  sm: "h-7 w-7 text-xs",
  md: "h-9 w-9 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-20 w-20 text-2xl",
};

const gradients = [
  "from-purple-600 to-blue-500",
  "from-pink-600 to-purple-500",
  "from-blue-600 to-cyan-500",
  "from-green-600 to-teal-500",
  "from-orange-600 to-pink-500",
  "from-red-600 to-orange-500",
];

function getGradient(username: string): string {
  const index = username.charCodeAt(0) % gradients.length;
  return gradients[index];
}

export const UserAvatar = memo(function UserAvatar({ username, iconUrl, size = "md", className }: Props) {
  const [imgError, setImgError] = useState(false);
  const sizeClass = sizeClasses[size];
  const gradient = getGradient(username);
  const initial = username.charAt(0).toUpperCase();

  if (iconUrl && !imgError) {
    return (
      <div className={clsx("relative shrink-0 overflow-hidden rounded-full", sizeClass, className)}>
        <Image
          src={iconUrl}
          alt={username}
          fill
          className="object-cover"
          sizes="80px"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white",
        sizeClass,
        gradient,
        className
      )}
      aria-label={username}
    >
      {initial}
    </div>
  );
});
