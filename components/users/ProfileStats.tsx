"use client";

type ProfileStatsProps = {
  avgRating: number;
  ratingCount: number;
};

export function ProfileStats({ avgRating, ratingCount }: ProfileStatsProps) {
  const stats = [
    { label: "平均評価", value: avgRating > 0 ? avgRating.toFixed(1) : "-", sub: "/ 5.0" },
    { label: "評価件数", value: ratingCount.toString(), sub: "件" },
  ];

  return (
    <div className="flex justify-center px-4 sm:px-6 py-4">
      {stats.map(({ label, value, sub }, i) => (
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
  );
}
