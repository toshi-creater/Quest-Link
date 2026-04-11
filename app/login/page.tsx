import { signIn } from "@/auth";
import { Logo } from "@/components/ui/Logo";
import { OAuthButton } from "@/components/ui/OAuthButton";

type Props = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;
  const redirectTo = callbackUrl?.startsWith("/") ? callbackUrl : "/rooms";
  const hasInviteToken = callbackUrl?.includes("inviteToken=") ?? false;

  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center px-4"
      style={{ backgroundColor: "var(--bg-base)" }}
    >
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center animate-fade-in-up">
          <Logo height={72} />
          <p className="mt-3 text-base" style={{ color: "var(--text-secondary)" }}>
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
          {hasInviteToken && (
            <div
              className="mb-4 rounded-lg border px-4 py-3 text-sm text-center"
              style={{
                borderColor: "var(--accent)",
                color: "var(--text-secondary)",
                backgroundColor: "rgba(124,58,237,0.08)",
              }}
            >
              この部屋に参加するにはログインが必要です
            </div>
          )}
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
            <form
              action={async () => {
                "use server";
                await signIn("google", { redirectTo });
              }}
            >
              <OAuthButton provider="google" type="submit" size="md" />
            </form>
            <form
              action={async () => {
                "use server";
                await signIn("twitter", { redirectTo });
              }}
            >
              <OAuthButton provider="twitter" type="submit" size="md" />
            </form>
            <form
              action={async () => {
                "use server";
                await signIn("discord", { redirectTo });
              }}
            >
              <OAuthButton provider="discord" type="submit" size="md" />
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
