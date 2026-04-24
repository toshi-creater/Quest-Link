"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "@phosphor-icons/react";
import { ProfileHero } from "@/components/users/ProfileHero";
import { ProfileInfo } from "@/components/users/ProfileInfo";
import { ProfileStats } from "@/components/users/ProfileStats";
import { GameScrollList } from "@/components/users/GameScrollList";

type UserProfile = {
  id: string;
  username: string;
  iconUrl: string | null;
  bio: string | null;
  avgRating: number;
  ratingCount: number;
  playStyleTags: { id: string; name: string; slug: string }[];
  games: { id: string; igdbId: number; name: string; coverImageUrl: string | null }[];
};

async function fetchUserProfile(userId: string): Promise<UserProfile> {
  const res = await fetch(`/api/v1/users/${userId}`);
  if (!res.ok) throw new Error("プロフィールの取得に失敗しました");
  const json = (await res.json()) as { data: UserProfile };
  return json.data;
}

export default function UserProfilePage() {
  const params = useParams<{ userId: string }>();
  const userId = params.userId;

  const { data: user, isLoading, isError } = useQuery({
    queryKey: ["users", userId],
    queryFn: () => fetchUserProfile(userId),
    enabled: !!userId,
  });

  if (isLoading) return null;

  if (isError || !user) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          ユーザーが見つかりませんでした
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl pb-8 sm:mt-2 sm:rounded-2xl sm:border sm:border-[var(--border)] sm:bg-[var(--bg-card)]">
      <ProfileHero
        username={user.username}
        iconUrl={user.iconUrl}
        actions={
          <div className="px-4 pt-4 sm:px-6">
            <Link
              href="/rooms"
              className="flex items-center gap-2 text-sm transition-colors hover:text-white"
              style={{ color: "var(--text-secondary)" }}
            >
              <ArrowLeft className="h-4 w-4" />
              部屋一覧
            </Link>
          </div>
        }
      />
      <ProfileInfo
        username={user.username}
        avgRating={user.avgRating}
        ratingCount={user.ratingCount}
        playStyleTags={user.playStyleTags}
        bio={user.bio}
        bioFallback="自己紹介はまだありません"
      />
      <ProfileStats avgRating={user.avgRating} ratingCount={user.ratingCount} />
      <GameScrollList games={user.games} />
    </div>
  );
}
