"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Edit2, History, Star } from "lucide-react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { PlayStyleTag } from "@/components/ui/PlayStyleTag";
import { RatingDisplay } from "@/components/ui/StarRating";
import { GameCover } from "@/components/ui/GamePicker";
import { DeleteAccountButton } from "./DeleteAccountButton";

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

  if (isLoading) {
    return (
      <div className="flex min-h-100 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

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
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
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
            {user.bio && (
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {user.bio}
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
          <div className="flex shrink-0 flex-col gap-2">
            <Link
              href="/users/me/edit"
              className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all hover:border-[var(--accent)]"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--bg-input)" }}
            >
              <Edit2 className="h-4 w-4" />
              プロフィール編集
            </Link>
            <Link
              href="/users/me/history"
              className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all hover:border-[var(--accent)]"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--bg-input)" }}
            >
              <History className="h-4 w-4" />
              参加履歴
            </Link>
          </div>
        </div>
      </div>

      {/* My Games */}
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
      <div className="mb-6 grid grid-cols-2 gap-4">
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
        className="mb-6 rounded-2xl border"
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

      {/* Danger Zone */}
      <div
        className="rounded-2xl border border-red-500/20 p-5"
        style={{ backgroundColor: "rgba(239,68,68,0.04)" }}
      >
        <h3 className="mb-1 text-sm font-semibold text-red-400">アカウント削除</h3>
        <p className="mb-3 text-sm" style={{ color: "var(--text-muted)" }}>
          アカウントを削除すると、すべてのデータが永久に削除されます。この操作は取り消せません。
        </p>
        <DeleteAccountButton />
      </div>
    </div>
  );
}
