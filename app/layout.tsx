import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/ui/Header";

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
        <Header />
        <main className="min-h-[calc(100vh-64px)]">{children}</main>
      </body>
    </html>
  );
}
