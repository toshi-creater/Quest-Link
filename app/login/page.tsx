import { Star, Zap, Shield, Users } from "lucide-react";
import { signIn } from "@/auth";

export default function LoginPage() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4 relative overflow-hidden"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      {/* Background decorations */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(124,58,237,0.18) 0%, transparent 60%)",
        }}
      />
      <div
        className="pointer-events-none absolute top-1/4 -left-32 h-96 w-96 rounded-full opacity-20 blur-3xl"
        style={{ backgroundColor: "var(--accent)" }}
      />
      <div
        className="pointer-events-none absolute bottom-1/4 -right-32 h-96 w-96 rounded-full opacity-10 blur-3xl"
        style={{ backgroundColor: "var(--accent-light)" }}
      />

      <div className="relative z-10 w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div
            className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              background: "linear-gradient(135deg, var(--accent), var(--accent-light))",
              boxShadow: "0 0 40px rgba(124,58,237,0.4)",
            }}
          >
            <Zap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
            Quest<span style={{ color: "var(--accent-light)" }}>Link</span>
          </h1>
          <p className="mt-2 text-lg" style={{ color: "var(--text-secondary)" }}>
            今すぐゲーム仲間を見つけよう
          </p>
        </div>

        {/* Features */}
        <div className="mb-8 grid grid-cols-3 gap-3">
          {[
            { icon: Zap, label: "即時マッチング", desc: "今すぐプレイ" },
            { icon: Shield, label: "評価システム", desc: "質の高い仲間" },
            { icon: Users, label: "フレンド不要", desc: "気軽に参加" },
          ].map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex flex-col items-center rounded-xl border p-3 text-center"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
            >
              <Icon className="mb-1 h-5 w-5" style={{ color: "var(--accent-light)" }} />
              <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                {label}
              </span>
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                {desc}
              </span>
            </div>
          ))}
        </div>

        {/* Login Card */}
        <div
          className="rounded-2xl border p-8"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border)",
            boxShadow: "0 0 60px rgba(0,0,0,0.5)",
          }}
        >
          <h2
            className="mb-2 text-center text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            ログイン
          </h2>
          <p className="mb-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
            Googleアカウントでかんたんにはじめられます
          </p>

          {/* Google Login Button */}
          <form
            action={async () => {
              "use server";
              await signIn("google", { redirectTo: "/rooms" });
            }}
          >
            <button
              type="submit"
              className="flex w-full items-center justify-center gap-3 rounded-xl border px-6 py-3.5 text-sm font-medium transition-all hover:shadow-lg"
              style={{
                backgroundColor: "#fff",
                borderColor: "#dadce0",
                color: "#3c4043",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path
                  fill="#4285F4"
                  d="M16.51 8H8.98v3h4.3c-.18 1-.74 1.48-1.6 2.04v2.01h2.6a7.8 7.8 0 0 0 2.38-5.88c0-.57-.05-.66-.15-1.18z"
                />
                <path
                  fill="#34A853"
                  d="M8.98 17c2.16 0 3.97-.72 5.3-1.94l-2.6-2a4.8 4.8 0 0 1-7.18-2.54H1.83v2.07A8 8 0 0 0 8.98 17z"
                />
                <path
                  fill="#FBBC05"
                  d="M4.5 10.52a4.8 4.8 0 0 1 0-3.04V5.41H1.83a8 8 0 0 0 0 7.18z"
                />
                <path
                  fill="#EA4335"
                  d="M8.98 4.18c1.17 0 2.23.4 3.06 1.2l2.3-2.3A8 8 0 0 0 1.83 5.4L4.5 7.49a4.77 4.77 0 0 1 4.48-3.31z"
                />
              </svg>
              Googleでログイン
            </button>
          </form>

          <p className="mt-4 text-center text-xs" style={{ color: "var(--text-muted)" }}>
            ログインすることで
            <span style={{ color: "var(--accent-light)" }}>利用規約</span>・
            <span style={{ color: "var(--accent-light)" }}>プライバシーポリシー</span>
            に同意したものとみなされます
          </p>
        </div>

        {/* Stats teaser */}
        <div className="mt-6 flex items-center justify-center gap-6 text-center">
          {[
            { value: "2,400+", label: "アクティブユーザー" },
            { value: "350+", label: "募集中の部屋" },
            { value: "4.5", label: "平均評価", icon: Star },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label}>
              <div className="flex items-center justify-center gap-1">
                {Icon && <Icon className="h-3 w-3" style={{ fill: "#eab308", color: "#eab308" }} />}
                <span className="text-base font-bold" style={{ color: "var(--text-primary)" }}>
                  {value}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
