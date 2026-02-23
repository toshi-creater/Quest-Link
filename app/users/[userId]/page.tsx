import Link from "next/link";
import { ArrowLeft, Star } from "lucide-react";
import { MOCK_USERS, MOCK_RATINGS } from "@/lib/mock-data";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { PlayStyleTag } from "@/components/ui/PlayStyleTag";
import { RatingDisplay } from "@/components/ui/StarRating";
import { GameCover } from "@/components/ui/GamePicker";

type Props = {
  params: Promise<{ userId: string }>;
};

export default async function UserProfilePage({ params }: Props) {
  const { userId } = await params;
  const user = MOCK_USERS.find((u) => u.id === userId) ?? MOCK_USERS[0];
  const ratings = MOCK_RATINGS.slice(0, 2);

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
          <UserAvatar
            username={user.username}
            iconUrl={user.iconUrl}
            size="xl"
          />
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
          { label: "平均評価", value: user.avgRating?.toFixed(1) ?? "-", sub: "/ 5.0" },
          { label: "評価件数", value: user.ratingCount.toString(), sub: "件" },
          { label: "参加部屋", value: "8", sub: "部屋" },
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
        {ratings.length > 0 ? (
          <ul className="divide-y" style={{ borderColor: "var(--border)" }}>
            {ratings.map((rating) => (
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
        ) : (
          <div className="px-6 py-8 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            まだ評価がありません
          </div>
        )}
      </div>
    </div>
  );
}
