import { Zap } from "lucide-react";
import { signIn } from "@/auth";

type Props = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;
  const redirectTo = callbackUrl?.startsWith("/") ? callbackUrl : "/rooms";

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <Zap className="mb-3 h-8 w-8" style={{ color: "var(--accent-light)" }} />
          <h1 className="text-4xl tracking-tight" style={{ color: "var(--text-primary)" }}>
            <span className="font-medium">Quest</span>
            <span className="font-bold">Link</span>
          </h1>
          <p className="mt-2 text-base" style={{ color: "var(--text-secondary)" }}>
            今すぐゲーム仲間を見つけよう
          </p>
        </div>

        {/* Login Card */}
        <div
          className="rounded-2xl border p-8"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border)",
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
              await signIn("google", { redirectTo });
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
      </div>
    </div>
  );
}
