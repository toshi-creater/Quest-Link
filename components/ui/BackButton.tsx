"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft } from "@phosphor-icons/react";

const TOP_LEVEL_HREFS = ["/", "/games", "/rooms/new", "/rooms/current/chat", "/users/me"];
const EXCLUDED_PATHS = ["/login", "/onboarding"];

function shouldShowBackButton(pathname: string): boolean {
  if (EXCLUDED_PATHS.includes(pathname)) return false;
  // /rooms/[roomId]/chat は ChatView 内に既存の戻るボタンがあるため除外
  if (/^\/rooms\/[^/]+\/chat$/.test(pathname)) return false;
  return !TOP_LEVEL_HREFS.includes(pathname);
}

function getParentPath(pathname: string): string {
  // /games/[gameId]/rooms → /games（/games/[gameId] のページが存在しないため）
  if (/^\/games\/[^/]+\/rooms$/.test(pathname)) return "/games";
  const lastSlash = pathname.lastIndexOf("/");
  return lastSlash > 0 ? pathname.slice(0, lastSlash) : "/";
}

export function BackButton() {
  const pathname = usePathname();
  if (!shouldShowBackButton(pathname)) return null;

  const href = getParentPath(pathname);
  const buttonStyle = {
    color: "var(--text-secondary)",
    backgroundColor: "var(--bg-card)",
    borderColor: "var(--border)",
  };

  return (
    <>
      {/* モバイル: 左上固定 */}
      <Link
        href={href}
        className="fixed top-3 left-4 z-50 md:hidden flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:text-white"
        style={buttonStyle}
        aria-label="前のページに戻る"
      >
        <ArrowLeft className="h-5 w-5" />
      </Link>

      {/* デスクトップ: main内の右上にabsolute配置（max-w-7xlコンテナ基準） */}
      <div className="hidden md:block absolute top-4 inset-x-0 z-40 pointer-events-none">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 flex justify-start pointer-events-auto">
          <Link
            href={href}
            className="flex h-9 w-9 items-center justify-center rounded-full border transition-colors hover:text-white"
            style={buttonStyle}
            aria-label="前のページに戻る"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </>
  );
}
