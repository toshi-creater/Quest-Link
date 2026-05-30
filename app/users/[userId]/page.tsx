"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ProfileLayout } from "@/components/users/ProfileLayout";
import { BlockButton } from "@/components/users/BlockButton";
import { ReportModal } from "@/components/users/ReportModal";

type UserProfile = {
  id: string;
  username: string;
  iconUrl: string | null;
  bio: string | null;
  avgRating: number;
  ratingCount: number;
  playStyleTags: { id: string; name: string; slug: string }[];
  games: { id: string; igdbId: number; name: string; coverImageUrl: string | null }[];
  isBlocked: boolean;
  isMe: boolean;
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
  const [showReport, setShowReport] = useState(false);

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

  const actions = !user.isMe ? (
    <div className="mt-4 flex flex-col gap-2">
      <BlockButton userId={user.id} isBlocked={user.isBlocked} />
      <button
        onClick={() => setShowReport(true)}
        className="flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-medium transition-all hover:opacity-80 active:scale-[0.97]"
        style={{ backgroundColor: "var(--bg-card-hover)", color: "var(--text-muted)" }}
      >
        このユーザーを通報する
      </button>
    </div>
  ) : null;

  return (
    <>
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
        footer={actions}
      />
      {showReport && (
        <ReportModal
          targetUserId={user.id}
          targetName={user.username}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  );
}
