"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Star, GameController } from "@phosphor-icons/react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { PlayStyleTag } from "@/components/ui/PlayStyleTag";
import { RatingDisplay, StarRating } from "@/components/ui/StarRating";

type ReceivedRating = {
  id: string;
  score: number;
  comment: string | null;
  createdAt: string;
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
      <div className="mx-auto max-w-3xl pb-8 sm:mt-6 sm:rounded-2xl sm:border sm:border-[var(--border)] sm:bg-[var(--bg-card)]">
        <div className="relative h-[200px] rounded-b-3xl sm:rounded-none sm:border-b sm:border-[var(--border)]" style={{ backgroundColor: "var(--bg-card)" }}>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
            <div className="h-20 w-20 rounded-full animate-shimmer" />
          </div>
        </div>
        <div className="pt-14 pb-4 text-center space-y-3 px-4 sm:px-6">
          <div className="h-7 w-40 rounded animate-shimmer mx-auto" />
          <div className="h-4 w-28 rounded animate-shimmer mx-auto" />
          <div className="h-4 w-64 rounded animate-shimmer mx-auto" />
        </div>
        <div className="flex justify-center gap-12 px-4 sm:px-6 py-6">
          <div className="h-12 w-20 rounded animate-shimmer" />
          <div className="h-12 w-20 rounded animate-shimmer" />
        </div>
        <div className="mx-4 sm:mx-6 space-y-4">
          <div className="h-36 rounded-2xl animate-shimmer" />
          <div className="h-24 rounded-2xl animate-shimmer" />
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
    <div className="mx-auto max-w-3xl pb-8 sm:mt-6 sm:rounded-2xl sm:border sm:border-[var(--border)] sm:bg-[var(--bg-card)]">
      {/* Hero + Avatar wrapper — relative so avatar can overflow hero */}
      <div className="relative">
        {/* Hero Banner */}
        <div
          className="min-h-[200px] overflow-hidden sm:rounded-t-2xl"
          style={{ backgroundColor: "var(--bg-card)" }}
        >
          {/* Background image */}
          <div className="absolute inset-0">
            {user.games[0]?.coverImageUrl ? (
              <Image
                src={user.games[0].coverImageUrl}
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
          {/* Back link — top left */}
          <div className="relative z-10 px-4 pt-4 sm:px-6">
            <Link
              href="/rooms"
              className="flex items-center gap-2 text-sm transition-colors hover:text-white"
              style={{ color: "var(--text-secondary)" }}
            >
              <ArrowLeft className="h-4 w-4" />
              部屋一覧
            </Link>
          </div>
          {/* Spacer for hero height */}
          <div className="pb-10 pt-14" />
        </div>
        {/* Avatar — centered at hero bottom, outside overflow-hidden */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-10">
          <UserAvatar username={user.username} iconUrl={user.iconUrl} size="xl" />
        </div>
      </div>

      {/* Profile Info — centered */}
      <div className="px-4 sm:px-6 pt-14 pb-4 text-center">
        <h1 className="text-xl sm:text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          {user.username}
        </h1>
        <div className="mt-1.5 flex justify-center">
          <RatingDisplay avgRating={user.avgRating} ratingCount={user.ratingCount} />
        </div>
        {user.playStyleTags.length > 0 && (
          <div className="mt-3 flex flex-wrap justify-center gap-2">
            {user.playStyleTags.map((tag) => (
              <PlayStyleTag key={tag.id} tag={tag} />
            ))}
          </div>
        )}
        {user.bio ? (
          <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {user.bio}
          </p>
        ) : (
          <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
            自己紹介はまだありません
          </p>
        )}
      </div>

      {/* Stats — inline with dividers */}
      <div className="flex justify-center px-4 sm:px-6 py-4">
        {[
          { label: "平均評価", value: user.avgRating > 0 ? user.avgRating.toFixed(1) : "-", sub: "/ 5.0" },
          { label: "評価件数", value: user.ratingCount.toString(), sub: "件" },
        ].map(({ label, value, sub }, i) => (
          <div key={label} className="flex">
            {i > 0 && (
              <div className="mx-6 w-px self-stretch" style={{ backgroundColor: "var(--border)" }} />
            )}
            <div className="text-center">
              <p className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
                {value}
                <span className="ml-1 text-sm font-normal" style={{ color: "var(--text-secondary)" }}>
                  {sub}
                </span>
              </p>
              <p className="mt-0.5 text-xs" style={{ color: "var(--text-muted)" }}>
                {label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* My Games */}
      <div className="mt-4">
        <h2 className="mb-3 px-4 sm:px-6 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          プレイしているゲーム
        </h2>
        {user.games.length > 0 ? (
          <div className="flex gap-3 overflow-x-auto px-4 sm:px-6 pb-2 scrollbar-none">
            {user.games.map((game) => (
              <div key={game.id} className="flex shrink-0 flex-col items-center gap-2">
                <div
                  className="relative h-36 w-28 overflow-hidden rounded-lg"
                  style={{ backgroundColor: "rgba(124,58,237,0.15)", border: "1px solid rgba(124,58,237,0.2)" }}
                >
                  {game.coverImageUrl ? (
                    <Image src={game.coverImageUrl} alt={game.name} fill className="object-cover" sizes="112px" />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <GameController className="h-6 w-6" style={{ color: "var(--accent-light)" }} />
                    </div>
                  )}
                </div>
                <span className="w-28 truncate text-center text-xs" style={{ color: "var(--text-secondary)" }}>
                  {game.name}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="px-4 sm:px-6 text-sm" style={{ color: "var(--text-muted)" }}>
            ゲームが設定されていません
          </p>
        )}
      </div>

      {/* Received Ratings */}
      <div className="mt-8 px-4 sm:px-6">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
          <Star className="h-3.5 w-3.5" style={{ fill: "#eab308", color: "#eab308" }} />
          受け取った評価
        </h2>
        {user.receivedRatings.length === 0 ? (
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            まだ評価がありません
          </p>
        ) : (
          <div className="space-y-3">
            {user.receivedRatings.map((rating) => (
              <div
                key={rating.id}
                className="rounded-xl p-4"
                style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <StarRating value={rating.score} readonly size="sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                      {new Date(rating.createdAt).toLocaleDateString("ja-JP")}
                    </span>
                    {rating.comment && (
                      <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                        {rating.comment}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
