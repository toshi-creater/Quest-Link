"use client";

import { useState } from "react";
import { Star } from "@phosphor-icons/react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { StarRating } from "@/components/ui/StarRating";

type ReceivedRating = {
  id: string;
  score: number;
  comment: string | null;
  createdAt: string;
  reviewer: { username: string | null; iconUrl: string | null };
};

type ReceivedRatingsListProps = {
  ratings: ReceivedRating[];
};

const RATINGS_PREVIEW_COUNT = 3;

export function ReceivedRatingsList({ ratings }: ReceivedRatingsListProps) {
  const [showAll, setShowAll] = useState(false);

  return (
    <div className="px-4 sm:px-6">
      <h2
        className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider"
        style={{ color: "var(--text-muted)" }}
      >
        <Star className="h-3.5 w-3.5" style={{ fill: "#eab308", color: "#eab308" }} />
        受け取った評価
      </h2>
      {ratings.length === 0 ? (
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          まだ評価がありません
        </p>
      ) : (
        <>
          <div className="space-y-3">
            {(showAll ? ratings : ratings.slice(0, RATINGS_PREVIEW_COUNT)).map((rating) => (
              <div
                key={rating.id}
                className="rounded-xl p-4"
                style={{ backgroundColor: "var(--bg-input)", border: "1px solid var(--border)" }}
              >
                <div className="flex items-start gap-3">
                  <UserAvatar
                    username={rating.reviewer.username}
                    iconUrl={rating.reviewer.iconUrl}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="text-sm font-medium truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {rating.reviewer.username ?? "退会済みユーザー"}
                      </span>
                      <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
                        {new Date(rating.createdAt).toLocaleDateString("ja-JP")}
                      </span>
                    </div>
                    <div className="mt-1">
                      <StarRating value={rating.score} readonly size="sm" />
                    </div>
                    {rating.comment && (
                      <p
                        className="mt-1.5 text-sm leading-relaxed"
                        style={{ color: "var(--text-secondary)" }}
                      >
                        {rating.comment}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {ratings.length > RATINGS_PREVIEW_COUNT && (
            <button
              type="button"
              onClick={() => setShowAll((prev) => !prev)}
              className="mt-3 w-full rounded-xl py-2.5 text-sm font-medium transition-colors hover:opacity-80"
              style={{
                backgroundColor: "var(--bg-input)",
                border: "1px solid var(--border)",
                color: "var(--accent-light)",
              }}
            >
              {showAll ? "折りたたむ" : `すべて見る（${ratings.length}件）`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
