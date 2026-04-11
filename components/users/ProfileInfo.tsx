"use client";

import { PlayStyleTag } from "@/components/ui/PlayStyleTag";
import { RatingDisplay } from "@/components/ui/StarRating";

type PlayStyleTagItem = {
  id: string;
  name: string;
  slug: string;
};

type ProfileInfoProps = {
  username: string;
  avgRating: number;
  ratingCount: number;
  playStyleTags: PlayStyleTagItem[];
  bio: string | null;
  bioFallback?: string;
};

export function ProfileInfo({
  username,
  avgRating,
  ratingCount,
  playStyleTags,
  bio,
  bioFallback,
}: ProfileInfoProps) {
  return (
    <div className="px-4 sm:px-6 pt-14 pb-4 text-center">
      <h1 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
        {username}
      </h1>
      <div className="mt-1.5 flex justify-center">
        <RatingDisplay avgRating={avgRating} ratingCount={ratingCount} />
      </div>
      {playStyleTags.length > 0 && (
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {playStyleTags.map((tag) => (
            <PlayStyleTag key={tag.id} tag={tag} />
          ))}
        </div>
      )}
      {bio ? (
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
          {bio}
        </p>
      ) : bioFallback ? (
        <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
          {bioFallback}
        </p>
      ) : null}
    </div>
  );
}
