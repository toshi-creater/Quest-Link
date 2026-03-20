"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Star } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { PlayStyleTag } from "@/components/ui/PlayStyleTag";
import { RatingDisplay } from "@/components/ui/StarRating";
import { GameCover } from "@/components/ui/GamePicker";

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

  if (isLoading) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 space-y-6">
        <div className="rounded-2xl border p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="h-20 w-20 rounded-full animate-shimmer shrink-0" />
            <div className="flex-1 space-y-3 w-full">
              <div className="h-7 w-40 rounded animate-shimmer" />
              <div className="h-4 w-28 rounded animate-shimmer" />
              <div className="h-4 w-full rounded animate-shimmer" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 rounded-xl border animate-shimmer" style={{ borderColor: "var(--border)" }} />
          ))}
        </div>
      </div>
    );
  }

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
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <Link
        href="/rooms"
        className="mb-6 flex items-center gap-2 text-sm transition-colors hover:text-white"
        style={{ color: "var(--text-secondary)" }}
      >
        <ArrowLeft className="h-4 w-4" />
        部屋一覧
      </Link>

      {/* Profile Card */}
      <div
        className="mb-6 rounded-2xl border p-6"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <UserAvatar username={user.username} iconUrl={user.iconUrl} size="xl" />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {user.username}
            </h1>
            <div className="mt-1.5">
              <RatingDisplay avgRating={user.avgRating} ratingCount={user.ratingCount} />
            </div>
            {user.bio ? (
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {user.bio}
              </p>
            ) : (
              <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
                自己紹介はまだありません
              </p>
            )}
            {user.playStyleTags.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                {user.playStyleTags.map((tag) => (
                  <PlayStyleTag key={tag.id} tag={tag} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User's Games */}
      {user.games.length > 0 && (
        <div
          className="mb-6 rounded-2xl border"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <div className="border-b px-6 py-4" style={{ borderColor: "var(--border)" }}>
            <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              プレイしているゲーム
            </h2>
          </div>
          <div className="flex flex-wrap gap-3 p-5">
            {user.games.map((game) => (
              <div
                key={game.id}
                className="flex items-center gap-2.5 rounded-xl border px-3 py-2.5"
                style={{ backgroundColor: "rgba(124,58,237,0.06)", borderColor: "rgba(124,58,237,0.2)" }}
              >
                <GameCover game={game} size="sm" />
                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {game.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="mb-6 grid grid-cols-3 gap-4">
        {[
          { label: "平均評価", value: user.avgRating > 0 ? user.avgRating.toFixed(1) : "-", sub: "/ 5.0" },
          { label: "評価件数", value: user.ratingCount.toString(), sub: "件" },
        ].map(({ label, value, sub }) => (
          <div
            key={label}
            className="rounded-xl border p-4 text-center"
            style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
          >
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {label}
            </p>
            <p className="mt-1 text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {value}
              <span className="text-sm font-normal" style={{ color: "var(--text-secondary)" }}>
                {sub}
              </span>
            </p>
          </div>
        ))}
      </div>

      {/* Received Ratings */}
      <div
        className="rounded-2xl border"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <div className="flex items-center gap-2 border-b px-6 py-4" style={{ borderColor: "var(--border)" }}>
          <Star className="h-4 w-4" style={{ fill: "#eab308", color: "#eab308" }} />
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            受け取った評価
          </h2>
        </div>
        <div className="px-6 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
          まだ評価がありません
        </div>
      </div>
    </div>
  );
}
