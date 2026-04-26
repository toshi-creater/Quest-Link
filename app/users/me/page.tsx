"use client";

import { useQuery } from "@tanstack/react-query";
import { ProfileLayout } from "@/components/users/ProfileLayout";
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
    <ProfileLayout
      title="プロフィール"
      titleAction={
        <div className="absolute right-2 top-2 md:hidden">
          <ProfileActionsMenu />
        </div>
      }
      username={user.username}
      iconUrl={user.iconUrl}
      bio={user.bio}
      playStyleTags={user.playStyleTags}
      avgRating={user.avgRating}
      ratingCount={user.ratingCount}
      games={user.games}
      receivedRatings={user.receivedRatings}
      footer={
        <div
          className="mx-4 sm:mx-6 mt-8 sm:mt-6 border-t pt-4 pb-4"
          style={{ borderColor: "var(--border)" }}
        >
          <DeleteAccountButton />
        </div>
      }
    />
  );
}
