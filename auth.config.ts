import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import Twitter from "next-auth/providers/twitter";
import Discord from "next-auth/providers/discord";

export const authConfig = {
  providers: [
    Google,
    Twitter,
    Discord({
      authorization: { params: { scope: "identify email" } },
    }),
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
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      const isLoginPage = pathname === "/login";
      const isOnboardingPage = pathname === "/onboarding";

      if (isLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      // 招待リンク経由の部屋詳細（/rooms/[roomId]?inviteToken=...）は未ログインでもアクセス可
      const isRoomDetailWithInvite =
        pathname.startsWith("/rooms/") &&
        !pathname.slice("/rooms/".length).includes("/") &&
        nextUrl.searchParams.has("inviteToken");

      // /rooms/[roomId]/ 配下（/chat, /guest 等）は未ログインでもアクセス可（ゲスト参加フローのため）
      const isRoomSubPath =
        pathname.startsWith("/rooms/") &&
        pathname.slice("/rooms/".length).includes("/");

      if (!isLoggedIn && (isRoomDetailWithInvite || isRoomSubPath)) return true;

      if (!isLoggedIn) return false;

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
