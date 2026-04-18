"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import clsx from "clsx";
import { Logo } from "@/components/ui/Logo";
import { NAV_ITEMS } from "@/components/ui/nav-items";
import { UserAvatar } from "@/components/ui/UserAvatar";

export function Header() {
  const pathname = usePathname();
  const { data: session, status } = useSession();

  if (pathname === "/login" || pathname === "/onboarding") return null;

  const isAuthenticated = status === "authenticated";

  return (
    <header
      className={`sticky top-0 z-50 h-16 border-b${pathname !== "/" ? " hidden md:block" : ""}`}
      style={{
        backgroundColor: "var(--bg-base)",
        borderColor: "var(--border)",
      }}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/">
          <Logo height={40} />
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon, requiresAuth, isActive: checkActive }) => {
            const isActive = checkActive(pathname);
            if (requiresAuth && !isAuthenticated) {
              return (
                <Link
                  key={href}
                  href={href}
                  prefetch={true}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-white"
                  style={{ color: "var(--text-secondary)" }}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            }
            return (
              <Link
                key={href}
                href={href}
                prefetch={true}
                className={clsx(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                  isActive ? "text-white" : "hover:text-white"
                )}
                style={
                  isActive
                    ? { backgroundColor: "rgba(124,58,237,0.2)", color: "var(--accent-light)" }
                    : { color: "var(--text-secondary)" }
                }
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}

        </nav>

        {/* User avatar - desktop only */}
        {isAuthenticated && session?.user && (
          <Link href="/users/me" className="hidden md:flex shrink-0">
            <UserAvatar
              username={session.user.username}
              iconUrl={session.user.iconUrl}
              size="sm"
            />
          </Link>
        )}
      </div>
    </header>
  );
}
