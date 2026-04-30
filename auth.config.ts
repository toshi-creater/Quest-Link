import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Twitter from "next-auth/providers/twitter";
import Discord from "next-auth/providers/discord";
import Credentials from "next-auth/providers/credentials";

const LOADTEST_EMAIL_RE = /^loadtest\+\d+@example\.com$/;

export async function stagingCredentialsAuthorize(
  credentials: Partial<Record<string, unknown>>
): Promise<{ id: string; email: string; name: string } | null> {
  const email = typeof credentials.email === "string" ? credentials.email : "";
  const password =
    typeof credentials.password === "string" ? credentials.password : "";
  const secret = process.env.CREDENTIALS_LOGIN_SECRET;
  if (!secret) return null;
  if (!LOADTEST_EMAIL_RE.test(email)) return null;
  if (password !== secret) return null;
  const username = email.split("@")[0];
  return { id: email, email, name: username };
}

const stagingProviders: NextAuthConfig["providers"] =
  process.env.STAGING_AUTH_BYPASS === "1"
    ? [
        Credentials({
          id: "staging-credentials",
          name: "Staging Test Account",
          credentials: {
            email: { label: "Email", type: "email" },
            password: { label: "Password", type: "password" },
          },
          authorize: stagingCredentialsAuthorize,
        }),
      ]
    : [];

export async function lhciCredentialsAuthorize(
  credentials: Partial<Record<string, unknown>>
): Promise<{ id: string; email: string; name: string } | null> {
  const email = typeof credentials.email === "string" ? credentials.email : "";
  const password =
    typeof credentials.password === "string" ? credentials.password : "";
  const expectedEmail = process.env.LHCI_TEST_EMAIL;
  const expectedPassword = process.env.LHCI_TEST_PASSWORD;
  if (!expectedEmail || !expectedPassword) return null;
  if (email !== expectedEmail) return null;
  if (password !== expectedPassword) return null;
  const username = email.split("@")[0];
  return { id: email, email, name: username };
}

const lhciProviders: NextAuthConfig["providers"] =
  process.env.LHCI_TEST_ENABLED === "true"
    ? [
        Credentials({
          id: "lhci-credentials",
          name: "LHCI Test Account",
          credentials: {
            email: { label: "Email", type: "email" },
            password: { label: "Password", type: "password" },
          },
          authorize: lhciCredentialsAuthorize,
        }),
      ]
    : [];

export const authConfig = {
  providers: [
    Google,
    Twitter,
    Discord({
      authorization: { params: { scope: "identify email" } },
    }),
    ...stagingProviders,
    ...lhciProviders,
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // セッションにusernameを含める（middlewareで参照するため）
    session({ session, token }) {
      if (token["username"]) {
        session.user.username = token["username"] as string;
      }
      session.user.needsProfileSetup = (token["needsProfileSetup"] as boolean | undefined) ?? false;
      return session;
    },
    authorized({ auth, request: { nextUrl, cookies } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      const isLoginPage = pathname === "/login";
      const isOnboardingPage = pathname === "/onboarding";

      if (isLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      const hasGuestSession = !!cookies.get("quest_link_guest_session");
      const isRoomPath = pathname.startsWith("/rooms/");
      // /rooms/new は部屋作成ページのためゲストセッション・招待リンクの対象外
      const isRoomNew = pathname === "/rooms/new";
      const isRoomDetail = isRoomPath && !isRoomNew && !pathname.slice("/rooms/".length).includes("/");

      if (!isLoggedIn) {
        // ゲストセッションがあれば /rooms/new 以外の /rooms/* すべてアクセス可
        if (isRoomPath && !isRoomNew && hasGuestSession) return true;
        // 招待リンク経由の部屋詳細（サブパスなし）もアクセス可
        if (isRoomDetail && nextUrl.searchParams.has("inviteToken")) return true;
        return false;
      }

      // 初回ログイン未設定 → プロフィール設定画面へ強制
      const needsProfileSetup = auth?.user?.needsProfileSetup ?? false;
      const hasInviteToken = nextUrl.searchParams.has("inviteToken");
      const hasNewUserError = nextUrl.searchParams.get("error") === "new_user";
      if (needsProfileSetup && !isOnboardingPage) {
        if (hasInviteToken) {
          if (!hasNewUserError) {
            // 招待URL経由の新規ユーザー（初回）→ エラーパラム付きで招待ページにリダイレクト
            const redirectUrl = new URL(nextUrl);
            redirectUrl.searchParams.set("error", "new_user");
            return Response.redirect(redirectUrl);
          }
          // error=new_user 付きで戻ってきた → そのまま表示（無限ループ防止）
          return true;
        }
        return Response.redirect(new URL("/onboarding", nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
