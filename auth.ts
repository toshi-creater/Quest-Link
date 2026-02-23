import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  callbacks: {
    authorized: authConfig.callbacks.authorized,
    async signIn({ profile }) {
      if (!profile?.sub) return false;

      const existing = await prisma.user.findUnique({
        where: { googleId: profile.sub },
        select: { id: true },
      });

      if (!existing) {
        const baseUsername = String(profile.sub).slice(0, 50);
        await prisma.user.create({
          data: {
            googleId: profile.sub,
            username: baseUsername,
            iconUrl: (profile.picture as string | undefined) ?? null,
          },
        });
      } else {
        await prisma.user.update({
          where: { googleId: profile.sub },
          data: { iconUrl: (profile.picture as string | undefined) ?? null },
        });
      }

      return true;
    },
    async jwt({ token, profile }) {
      if (profile?.sub) {
        const user = await prisma.user.findUnique({
          where: { googleId: profile.sub },
          select: {
            id: true,
            username: true,
            iconUrl: true,
            avgRating: true,
          },
        });
        if (user) {
          token["userId"] = user.id;
          token["username"] = user.username;
          token["iconUrl"] = user.iconUrl;
          token["avgRating"] = Number(user.avgRating);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token["userId"]) {
        session.user.id = token["userId"] as string;
        session.user.username = token["username"] as string;
        session.user.iconUrl = (token["iconUrl"] as string | null) ?? null;
        session.user.avgRating = token["avgRating"] as number;
      }
      return session;
    },
  },
});
