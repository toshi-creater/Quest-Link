"use client";

import { UserAvatar } from "@/components/ui/UserAvatar";
import { ProfileInfo } from "@/components/users/ProfileInfo";
import { GameScrollList } from "@/components/users/GameScrollList";
import { ReceivedRatingsList } from "@/components/users/ReceivedRatingsList";

type Game = {
  id: string;
  igdbId: number;
  name: string;
  coverImageUrl: string | null;
};

type PlayStyleTagItem = {
  id: string;
  name: string;
  slug: string;
};

type ReceivedRating = {
  id: string;
  score: number;
  comment: string | null;
  createdAt: string;
  reviewer: { username: string | null; iconUrl: string | null };
};

type ProfileLayoutProps = {
  title: string;
  titleAction?: React.ReactNode;
  username: string;
  iconUrl: string | null;
  bio: string | null;
  bioFallback?: string;
  playStyleTags: PlayStyleTagItem[];
  avgRating: number;
  ratingCount: number;
  games: Game[];
  receivedRatings?: ReceivedRating[];
  footer?: React.ReactNode;
};

export function ProfileLayout({
  title,
  titleAction,
  username,
  iconUrl,
  bio,
  bioFallback,
  playStyleTags,
  avgRating,
  ratingCount,
  games,
  receivedRatings,
  footer,
}: ProfileLayoutProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-0 pb-8">
      <div className="relative px-4 md:px-0 pt-6 sm:pt-8 mb-6 sm:mb-8">
        <h1
          className="text-lg sm:text-2xl font-bold text-center md:text-left"
          style={{ color: "var(--text-primary)" }}
        >
          {title}
        </h1>
        {titleAction}
      </div>
      <div className="space-y-4 pt-10">
        <div className="relative pt-10 rounded-xl" style={{ backgroundColor: "var(--bg-card)" }}>
          <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2">
            <UserAvatar username={username} iconUrl={iconUrl} size="xl" />
          </div>
          <ProfileInfo
            username={username}
            playStyleTags={playStyleTags}
            bio={bio}
            bioFallback={bioFallback}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div
            className="flex flex-col items-center py-4 rounded-xl"
            style={{ backgroundColor: "var(--bg-card)" }}
          >
            <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {avgRating > 0 ? avgRating.toFixed(1) : "-"}
              <span className="ml-1 text-sm font-normal" style={{ color: "var(--text-secondary)" }}>
                / 5.0
              </span>
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>平均評価</p>
          </div>
          <div
            className="flex flex-col items-center py-4 rounded-xl"
            style={{ backgroundColor: "var(--bg-card)" }}
          >
            <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {ratingCount}
              <span className="ml-1 text-sm font-normal" style={{ color: "var(--text-secondary)" }}>
                件
              </span>
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>評価件数</p>
          </div>
        </div>
        <div className="py-4 rounded-xl" style={{ backgroundColor: "var(--bg-card)" }}>
          <GameScrollList games={games} />
        </div>
        {receivedRatings && (
          <div className="py-4 rounded-xl" style={{ backgroundColor: "var(--bg-card)" }}>
            <ReceivedRatingsList ratings={receivedRatings} />
          </div>
        )}
      </div>
      {footer}
    </div>
  );
}
