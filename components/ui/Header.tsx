"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import clsx from "clsx";
import { Chat, ChatDots, ChatText } from "@phosphor-icons/react";
import { Logo } from "@/components/ui/Logo";
import { HeaderSearchBar } from "@/components/ui/HeaderSearchBar";
import { UserAvatarMenu } from "@/components/ui/UserAvatarMenu";
import { DESKTOP_NAV_ITEMS } from "@/components/ui/nav-items";

export function Header() {
  const pathname = usePathname();
  const { status } = useSession();

  if (pathname === "/login" || pathname === "/onboarding") return null;

  const isAuthenticated = status === "authenticated";
  const isChatActive =
    pathname.startsWith("/rooms/") && !pathname.startsWith("/rooms/new");

  return (
    <header
      className="sticky top-0 z-50 hidden h-16 md:block"
      style={{
        backgroundColor: "var(--bg-base)",
      }}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center gap-6 px-4 sm:px-6">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <Logo height={40} />
        </Link>

        {/* Search Bar (center) */}
        <div className="flex flex-1 justify-end">
          <HeaderSearchBar />
        </div>

        {/* Right Actions */}
        <nav className="flex shrink-0 items-center gap-3">
          {DESKTOP_NAV_ITEMS.map(
            ({ href, label, icon: Icon, isActive: checkActive }) => {
              const isActive = checkActive(pathname);
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch={true}
                  className={clsx(
                    "flex items-center gap-1 rounded-lg px-3 py-2 font-medium transition-all",
                    isActive
                      ? "text-white"
                      : "hover:text-white hover:bg-[rgba(124,58,237,0.1)]"
                  )}
                  style={
                    isActive
                      ? {
                          backgroundColor: "rgba(124,58,237,0.2)",
                          color: "var(--accent-light)",
                        }
                      : { color: "var(--text-secondary)" }
                  }
                >
                  <Icon size={24} />
                  {label}
                </Link>
              );
            }
          )}

          {isAuthenticated && (
            <Link
              href="/rooms/current/chat"
              prefetch={true}
              aria-label="参加中の部屋"
              className={clsx(
                "flex items-center rounded-lg p-2 transition-all",
                isChatActive
                  ? "text-white"
                  : "hover:text-white hover:bg-[rgba(124,58,237,0.1)]"
              )}
              style={
                isChatActive
                  ? {
                      backgroundColor: "rgba(124,58,237,0.2)",
                      color: "var(--accent-light)",
                    }
                  : { color: "var(--text-secondary)" }
              }
            >
              <ChatText size={28}/>
            </Link>
          )}

          {isAuthenticated ? (
            <UserAvatarMenu />
          ) : (
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-white hover:bg-[rgba(124,58,237,0.1)]"
              style={{ color: "var(--text-secondary)" }}
            >
              ログイン
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
