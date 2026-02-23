import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";

export const authConfig = {
  providers: [Google],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      if (pathname === "/login") {
        if (isLoggedIn) return Response.redirect(new URL("/rooms", nextUrl));
        return true;
      }

      if (!isLoggedIn) return false;
      return true;
    },
  },
} satisfies NextAuthConfig;
