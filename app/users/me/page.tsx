"use client";

import { useQuery } from "@tanstack/react-query";
import { ProfileHero } from "@/components/users/ProfileHero";
import { ProfileInfo } from "@/components/users/ProfileInfo";
import { ProfileStats } from "@/components/users/ProfileStats";
import { GameScrollList } from "@/components/users/GameScrollList";
import { ReceivedRatingsList } from "@/components/users/ReceivedRatingsList";
import { ProfileActionsMenu } from "@/components/users/ProfileActionsMenu";
import { DeleteAccountButton } from "./DeleteAccountButton";

type ReceivedRating = {
  id: string;
  score: number;
  comment: string | null;
  createdAt: string;
  reviewer: { username: string | null; iconUrl: string | null };
};

type UserProfile = {
  id: string;
  username: string;
  iconUrl: string | null;
  bio: string | null;
  avgRating: number;
  ratingCount: number;
  playStyleTags: { id: string; name: string; slug: string }[];
  games: { id: string; igdbId: number; name: string; coverImageUrl: string | null }[];
  receivedRatings: ReceivedRating[];
};

async function fetchMyProfile(): Promise<UserProfile> {
  const res = await fetch("/api/v1/users/me");
  if (!res.ok) throw new Error("プロフィールの取得に失敗しました");
  const json = (await res.json()) as { data: UserProfile };
  return json.data;
}

export default function MyProfilePage() {
  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["users", "me"],
    queryFn: fetchMyProfile,
  });

  if (isLoading) return null;

  if (isError || !user) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          プロフィールの読み込みに失敗しました
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl pb-8">
      <div className="relative px-4 md:px-0 pt-4 sm:pt-6 mb-3 sm:mb-4">
        <h1
          className="text-lg sm:text-2xl font-bold text-center md:text-left"
          style={{ color: "var(--text-primary)" }}
        >
          プロフィール
        </h1>
        <div className="absolute right-2 top-2 md:hidden">
          <ProfileActionsMenu />
        </div>
      </div>
      <div className="sm:rounded-2xl sm:border sm:border-[var(--border)] sm:bg-[var(--bg-card)]">
        <ProfileHero username={user.username} iconUrl={user.iconUrl} />
        <ProfileInfo
          username={user.username}
          avgRating={user.avgRating}
          ratingCount={user.ratingCount}
          playStyleTags={user.playStyleTags}
          bio={user.bio}
        />
        <ProfileStats avgRating={user.avgRating} ratingCount={user.ratingCount} />
        <GameScrollList games={user.games} />
        <ReceivedRatingsList ratings={user.receivedRatings} />
        <div
          className="mx-4 sm:mx-6 mt-8 border-t pt-4 pb-4 sm:pb-6"
          style={{ borderColor: "var(--border)" }}
        >
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  );
}
