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

      const isPublicPage =
        pathname === "/" ||
        pathname === "/rooms" ||
        pathname.startsWith("/rooms/");
      if (!isLoggedIn && isPublicPage) return true;

      if (!isLoggedIn) return false;

      // 初回ログイン未設定 → プロフィール設定画面へ強制
      const needsProfileSetup = auth?.user?.needsProfileSetup ?? false;
      if (needsProfileSetup && !isOnboardingPage) {
        return Response.redirect(new URL("/onboarding", nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
