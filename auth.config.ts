import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    // セッションにusernameを含める（middlewareで参照するため）
    session({ session, token }) {
      if (token["username"]) {
        session.user.username = token["username"] as string;
      }
      return session;
    },
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      const isLoginPage = pathname === "/login";
      const isEditPage = pathname === "/users/me/edit";

      if (isLoginPage) {
        if (isLoggedIn) return Response.redirect(new URL("/", nextUrl));
        return true;
      }

      const isPublicPage = pathname === "/" || pathname === "/rooms";
      if (!isLoggedIn && isPublicPage) return true;

      if (!isLoggedIn) return false;

      // Google sub IDのまま（初回ログイン未設定）→ プロフィール設定画面へ強制
      const username = auth?.user?.username ?? "";
      const needsProfileSetup = /^\d{15,}$/.test(username);
      if (needsProfileSetup && !isEditPage) {
        return Response.redirect(new URL("/users/me/edit", nextUrl));
      }

      return true;
    },
  },
} satisfies NextAuthConfig;
