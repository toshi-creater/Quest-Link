import Link from "next/link";
import { Edit2, History, Star } from "lucide-react";
import { CURRENT_USER, MOCK_RATINGS } from "@/lib/mock-data";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { PlayStyleTag } from "@/components/ui/PlayStyleTag";
import { RatingDisplay } from "@/components/ui/StarRating";
import { GameCover } from "@/components/ui/GamePicker";
import { DeleteAccountButton } from "./DeleteAccountButton";

export default function MyProfilePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Profile Card */}
      <div
        className="mb-6 rounded-2xl border p-6"
        style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
      >
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <UserAvatar
            username={CURRENT_USER.username}
            iconUrl={CURRENT_USER.iconUrl}
            size="xl"
          />
          <div className="flex-1 text-center sm:text-left">
            <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
              {CURRENT_USER.username}
            </h1>
            <div className="mt-1.5">
              <RatingDisplay
                avgRating={CURRENT_USER.avgRating}
                ratingCount={CURRENT_USER.ratingCount}
              />
            </div>
            {CURRENT_USER.bio && (
              <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {CURRENT_USER.bio}
              </p>
            )}
            {CURRENT_USER.playStyleTags.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                {CURRENT_USER.playStyleTags.map((tag) => (
                  <PlayStyleTag key={tag.id} tag={tag} />
                ))}
              </div>
            )}
          </div>
          <div className="flex shrink-0 flex-col gap-2">
            <Link
              href="/users/me/edit"
              className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all hover:border-purple-500"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--bg-input)" }}
            >
              <Edit2 className="h-4 w-4" />
              プロフィール編集
            </Link>
            <Link
              href="/users/me/history"
              className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all hover:border-purple-500"
              style={{ borderColor: "var(--border)", color: "var(--text-secondary)", backgroundColor: "var(--bg-input)" }}
            >
              <History className="h-4 w-4" />
              参加履歴
            </Link>
          </div>
        </div>
      </div>

      {/* My Games */}
      {CURRENT_USER.games.length > 0 && (
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
            {CURRENT_USER.games.map((game) => (
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
          { label: "平均評価", value: CURRENT_USER.avgRating?.toFixed(1) ?? "-", sub: "/ 5.0" },
          { label: "評価件数", value: CURRENT_USER.ratingCount.toString(), sub: "件" },
          { label: "参加部屋", value: "12", sub: "部屋" },
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
        <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
          {MOCK_RATINGS.map((rating) => (
            <li key={rating.id} className="px-6 py-4" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-start gap-3">
                <UserAvatar
                  username={rating.reviewer.username}
                  iconUrl={rating.reviewer.iconUrl}
                  size="sm"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                      {rating.reviewer.username}
                    </span>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-3.5 w-3.5"
                          style={{
                            fill: i < rating.score ? "#eab308" : "transparent",
                            color: i < rating.score ? "#eab308" : "var(--text-muted)",
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  {rating.comment && (
                    <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
                      {rating.comment}
                    </p>
                  )}
                  <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                    {new Date(rating.createdAt).toLocaleDateString("ja-JP")}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Danger Zone */}
      <div
        className="rounded-2xl border border-red-500/20 p-5"
        style={{ backgroundColor: "rgba(239,68,68,0.04)" }}
      >
        <h3 className="mb-1 text-sm font-semibold text-red-400">アカウント削除</h3>
        <p className="mb-3 text-xs" style={{ color: "var(--text-muted)" }}>
          アカウントを削除すると、すべてのデータが永久に削除されます。この操作は取り消せません。
        </p>
        <DeleteAccountButton />
      </div>
    </div>
  );
}
