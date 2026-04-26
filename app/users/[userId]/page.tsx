"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { BackButton } from "@/components/ui/BackButton";
import { ProfileLayout } from "@/components/users/ProfileLayout";

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
    <ProfileLayout
      title="プロフィール"
      username={user.username}
      iconUrl={user.iconUrl}
      bio={user.bio}
      bioFallback="自己紹介はまだありません"
      playStyleTags={user.playStyleTags}
      avgRating={user.avgRating}
      ratingCount={user.ratingCount}
      games={user.games}
    />
  );
}
