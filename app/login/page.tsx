import { Lightning } from "@phosphor-icons/react/dist/ssr";
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
        <div className="mb-8 flex flex-col items-center animate-fade-in-up">
          <Lightning className="mb-3 h-8 w-8" style={{ color: "var(--accent-light)" }} />
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
          className="rounded-2xl border p-8 animate-fade-in-up"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border)",
            animationDelay: "120ms",
          }}
        >
          <h2
            className="mb-2 text-center text-xl font-semibold"
            style={{ color: "var(--text-primary)" }}
          >
            ログイン
          </h2>
          <p className="mb-6 text-center text-sm" style={{ color: "var(--text-secondary)" }}>
            ソーシャルアカウントでかんたんにはじめられます
          </p>

          <div className="space-y-3">
            {/* Google Login Button */}
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo });
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-xl border px-6 py-3.5 text-sm font-medium transition-all hover:shadow-lg active:scale-[0.97]"
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

            {/* X (Twitter) Login Button */}
            <form
              action={async () => {
                "use server";
                await signIn("twitter", { redirectTo });
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-xl border px-6 py-3.5 text-sm font-medium transition-all hover:opacity-80 active:scale-[0.97]"
                style={{
                  backgroundColor: "#000",
                  borderColor: "#333",
                  color: "#fff",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                X（Twitter）でログイン
              </button>
            </form>

            {/* Discord Login Button */}
            <form
              action={async () => {
                "use server";
                await signIn("discord", { redirectTo });
              }}
            >
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-xl border px-6 py-3.5 text-sm font-medium transition-all hover:opacity-80 active:scale-[0.97]"
                style={{
                  backgroundColor: "#5865F2",
                  borderColor: "#4752c4",
                  color: "#fff",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.043.03.056a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Discordでログイン
              </button>
            </form>
          </div>

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
