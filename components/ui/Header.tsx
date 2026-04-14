"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { House, PlusCircle, Chat, User, Users, ArrowLeft } from "@phosphor-icons/react";
import clsx from "clsx";
import { SignOutButton } from "@/components/ui/SignOutButton";
import { Logo } from "@/components/ui/Logo";

export function Header() {
  const pathname = usePathname();
  const { status } = useSession();

  if (pathname === "/login" || pathname === "/onboarding") return null;

  const isAuthenticated = status === "authenticated";

  const topLevelHrefs = ["/", "/games", "/rooms/new", "/rooms/current/chat", "/users/me"];
  const isNestedPage =
    pathname !== "/login" &&
    pathname !== "/onboarding" &&
    !/^\/rooms\/[^/]+\/chat$/.test(pathname) &&
    !topLevelHrefs.includes(pathname);
  const parentPath = (() => {
    if (/^\/games\/[^/]+\/rooms$/.test(pathname)) return "/games";
    const idx = pathname.lastIndexOf("/");
    return idx > 0 ? pathname.slice(0, idx) : "/";
  })();

  const staticNavItems = [
    { href: "/", label: "トップ", icon: House, requiresAuth: false },
    { href: "/games", label: "部屋を探す", icon: Users, requiresAuth: false },
    { href: "/rooms/new", label: "部屋作成", icon: PlusCircle, requiresAuth: true },
    { href: "/rooms/current/chat", label: "参加中の部屋", icon: Chat, requiresAuth: true },
    { href: "/users/me", label: "プロフィール", icon: User, requiresAuth: true },
  ];

  return (
    <header
      className={`sticky top-0 z-50 h-16 border-b${pathname !== "/" ? " hidden md:block" : ""}`}
      style={{
        backgroundColor: "var(--bg-base)",
        borderColor: "var(--border)",
      }}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: back button (nested pages) + logo */}
        <div className="flex items-center gap-2">
          {isNestedPage && (
            <Link
              href={parentPath}
              className="hidden md:flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:text-white"
              style={{ color: "var(--text-secondary)" }}
              aria-label="前のページに戻る"
            >
              <ArrowLeft className="h-5 w-5" />
            </Link>
          )}
          <Link href="/">
            <Logo height={40} />
          </Link>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {staticNavItems.map(({ href, label, icon: Icon, requiresAuth }) => {
            const isActive = href === "/" || href === "/games" ? pathname === href : pathname.startsWith(href);
            if (requiresAuth && !isAuthenticated) {
              return (
                <Link
                  key={href}
                  href={href}
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

          {isAuthenticated && (
            <>
              <div className="mx-2 h-6 w-px" style={{ backgroundColor: "var(--border)" }} />
              <SignOutButton />
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
