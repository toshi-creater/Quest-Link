import NextAuth from "next-auth";
import { authConfig } from "./auth.config";
import { prisma } from "@/lib/prisma";
import {
  toDbProvider,
  extractProviderUserId,
  extractAvatarUrl,
} from "@/lib/auth-providers";

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  ...authConfig,
  session: { strategy: "jwt" },
  callbacks: {
    authorized: authConfig.callbacks.authorized,
    session({ session, token }) {
      if (token["userId"]) {
        session.user.id = token["userId"] as string;
        session.user.username = token["username"] as string;
        session.user.iconUrl = (token["iconUrl"] as string | null) ?? null;
        session.user.avgRating = token["avgRating"] as number;
      }
      session.user.needsProfileSetup =
        (token["needsProfileSetup"] as boolean | undefined) ?? false;
      return session;
    },
    async signIn({ account, profile }) {
      if (!account?.provider || !profile) return false;

      const provider = toDbProvider(account.provider);
      const providerUserId = extractProviderUserId(
        account.provider,
        profile as Record<string, unknown>
      );
      if (!providerUserId) return false;

      const avatarUrl = extractAvatarUrl(
        account.provider,
        profile as Record<string, unknown>
      );

      const existing = await prisma.oauthProviderAccount.findUnique({
        where: { provider_providerUserId: { provider, providerUserId } },
        select: { userId: true },
      });

      if (!existing) {
        // 初回ログイン: ユーザーを作成し OAuth アカウントを紐づける
        const user = await prisma.user.create({
          data: {
            username: providerUserId.slice(0, 50),
            iconUrl: avatarUrl,
          },
          select: { id: true },
        });
        await prisma.oauthProviderAccount.create({
          data: {
            userId: user.id,
            provider,
            providerUserId,
          },
        });
      } else {
        await prisma.user.update({
          where: { id: existing.userId },
          data: { iconUrl: avatarUrl },
        });
      }

      return true;
    },
    async jwt({ token, account, profile, trigger }) {
      // セッション更新時（プロフィール設定完了後）: DBから最新usernameを取得
      if (trigger === "update" && token["userId"]) {
        const user = await prisma.user.findUnique({
          where: { id: token["userId"] as string },
          select: { username: true, iconUrl: true, avgRating: true },
        });
        if (user) {
          token["username"] = user.username;
          token["iconUrl"] = user.iconUrl;
          token["avgRating"] = Number(user.avgRating);
          token["needsProfileSetup"] = false;
        }
        return token;
      }

      // 初回ログイン時: DBからユーザー情報を取得してトークンに格納
      if (account?.provider && profile) {
        const provider = toDbProvider(account.provider);
        const providerUserId = extractProviderUserId(
          account.provider,
          profile as Record<string, unknown>
        );
        if (providerUserId) {
          const oauthAccount = await prisma.oauthProviderAccount.findUnique({
            where: {
              provider_providerUserId: { provider, providerUserId },
            },
            select: {
              user: {
                select: { id: true, username: true, iconUrl: true, avgRating: true },
              },
            },
          });
          if (oauthAccount?.user) {
            const { id, username, iconUrl, avgRating } = oauthAccount.user;
            token["userId"] = id;
            token["username"] = username;
            token["iconUrl"] = iconUrl;
            token["avgRating"] = Number(avgRating);
            // username がプロバイダIDのままなら初回セットアップが必要
            token["needsProfileSetup"] =
              username === providerUserId.slice(0, 50);
          }
        }
      }

      return token;
    },
  },
});
