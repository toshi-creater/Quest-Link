"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PencilSimple, ClockCounterClockwise } from "@phosphor-icons/react";
import { ProfileHero } from "@/components/users/ProfileHero";
import { ProfileInfo } from "@/components/users/ProfileInfo";
import { ProfileStats } from "@/components/users/ProfileStats";
import { GameScrollList } from "@/components/users/GameScrollList";
import { ReceivedRatingsList } from "@/components/users/ReceivedRatingsList";
import { DeleteAccountButton } from "./DeleteAccountButton";
import { SignOutButton } from "@/components/ui/SignOutButton";

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
    <div className="mx-auto max-w-3xl pb-8 sm:mt-6 sm:rounded-2xl sm:border sm:border-[var(--border)] sm:bg-[var(--bg-card)]">
      <ProfileHero
        coverImageUrl={user.games[0]?.coverImageUrl}
        username={user.username}
        iconUrl={user.iconUrl}
        actions={
          <div className="flex justify-end gap-2 px-4 pt-4 sm:px-6">
            <Link
              href="/users/me/edit"
              className="flex items-center gap-2 rounded-xl border p-2 sm:px-4 sm:py-2 text-sm font-medium transition-all hover:border-[var(--accent)]"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--bg-input)" }}
            >
              <PencilSimple className="h-4 w-4" />
              <span className="hidden sm:inline">プロフィール編集</span>
            </Link>
            <Link
              href="/users/me/history"
              className="flex items-center gap-2 rounded-xl border p-2 sm:px-4 sm:py-2 text-sm font-medium transition-all hover:border-[var(--accent)]"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--bg-input)" }}
            >
              <ClockCounterClockwise className="h-4 w-4" />
              <span className="hidden sm:inline">参加履歴</span>
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
      />
      <ProfileStats avgRating={user.avgRating} ratingCount={user.ratingCount} />
      <GameScrollList games={user.games} />
      <ReceivedRatingsList ratings={user.receivedRatings} />
      <div className="mx-4 sm:mx-6 mt-8 space-y-4">
        <div>
          <SignOutButton />
        </div>
        <div className="border-t pt-4" style={{ borderColor: "var(--border)" }}>
          <DeleteAccountButton />
        </div>
      </div>
    </div>
  );
}
