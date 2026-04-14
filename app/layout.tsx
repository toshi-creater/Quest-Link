import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/ui/Header";
import { BottomNav } from "@/components/ui/BottomNav";
import { BackButton } from "@/components/ui/BackButton";
import { Providers } from "./providers";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-sans",
  display: "swap",
  preload: false,
});

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
    <html lang="ja" className={notoSansJP.variable}>
      <body className="antialiased min-h-screen" style={{ backgroundColor: "var(--bg-base)", color: "var(--text-primary)" }}>
        <Providers>
          <Header />
          <main className="relative min-h-screen md:min-h-[calc(100vh_-_64px)] pb-[calc(60px_+_env(safe-area-inset-bottom))] md:pb-0">
            <BackButton />
            {children}
          </main>
          <BottomNav />
        </Providers>
      </body>
    </html>
  );
}
