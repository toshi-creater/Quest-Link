import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/ui/Header";
import { BottomNav } from "@/components/ui/BottomNav";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "QuestLink - ゲーム仲間を見つけよう",
  description: "オンラインゲームで一緒にプレイする相手をリアルタイムで見つけるマッチングプラットフォーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased min-h-screen" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>
        <Providers>
          <Header />
          <main className="min-h-[calc(100vh-64px)] pb-[60px] md:pb-0">{children}</main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
