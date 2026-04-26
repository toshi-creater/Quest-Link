"use client";

import { useQuery } from "@tanstack/react-query";
import { ProfileHero } from "@/components/users/ProfileHero";
import { ProfileInfo } from "@/components/users/ProfileInfo";
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
      <div className="space-y-4">
        <div
          className=""
          style={{ backgroundColor: "var(--bg-card)" }}
        >
          <ProfileHero username={user.username} iconUrl={user.iconUrl} />
          <ProfileInfo
            username={user.username}
            playStyleTags={user.playStyleTags}
            bio={user.bio}
          />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div
            className=" flex flex-col items-center py-4"
            style={{ backgroundColor: "var(--bg-card)" }}
          >
            <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {user.avgRating > 0 ? user.avgRating.toFixed(1) : "-"}
              <span className="ml-1 text-sm font-normal" style={{ color: "var(--text-secondary)" }}>
                / 5.0
              </span>
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>平均評価</p>
          </div>
          <div
            className=" flex flex-col items-center py-4"
            style={{ backgroundColor: "var(--bg-card)" }}
          >
            <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {user.ratingCount}
              <span className="ml-1 text-sm font-normal" style={{ color: "var(--text-secondary)" }}>
                件
              </span>
            </p>
            <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>評価件数</p>
          </div>
        </div>
        <div
          className=" py-4"
          style={{ backgroundColor: "var(--bg-card)" }}
        >
          <GameScrollList games={user.games} />
        </div>
        <div
          className=" py-4"
          style={{ backgroundColor: "var(--bg-card)" }}
        >
          <ReceivedRatingsList ratings={user.receivedRatings} />
        </div>
      </div>
      <div
        className="mx-4 sm:mx-6 mt-8 sm:mt-6 border-t pt-4 pb-4"
        style={{ borderColor: "var(--border)" }}
      >
        <DeleteAccountButton />
      </div>
    </div>
  );
}
