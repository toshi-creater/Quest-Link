"use client";

import Image from "next/image";
import { UserAvatar } from "@/components/ui/UserAvatar";

type ProfileHeroProps = {
  coverImageUrl?: string | null;
  username: string;
  iconUrl: string | null;
  actions?: React.ReactNode;
};

export function ProfileHero({ coverImageUrl, username, iconUrl, actions }: ProfileHeroProps) {
  return (
    <div className="relative">
      {/* Hero Banner */}
      <div
        className="min-h-[200px] overflow-hidden sm:rounded-t-2xl"
        style={{ backgroundColor: "var(--bg-card)" }}
      >
        {/* Background image */}
        <div className="absolute inset-0">
          {coverImageUrl ? (
            <Image
              src={coverImageUrl}
              alt=""
              fill
              className="object-cover"
              sizes="768px"
              aria-hidden="true"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{ background: "linear-gradient(135deg, #1e1030 0%, #2d1b69 50%, #1a0f2e 100%)" }}
            />
          )}
        </div>
        {/* Action slot — top area */}
        {actions && (
          <div className="relative z-10">
            {actions}
          </div>
        )}
        {/* Spacer for hero height */}
        <div className="pb-10 pt-14" />
      </div>
      {/* Avatar — centered at hero bottom, outside overflow-hidden */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
        <UserAvatar username={username} iconUrl={iconUrl} size="xl" />
      </div>
    </div>
  );
}
