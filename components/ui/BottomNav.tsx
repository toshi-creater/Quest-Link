"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { House, PlusCircle, Chat, User, Users } from "@phosphor-icons/react";

export function BottomNav() {
  const pathname = usePathname();
  const { status } = useSession();

  if (pathname === "/login" || pathname === "/onboarding") return null;

  const isAuthenticated = status === "authenticated";

  const staticItems = [
    { href: "/", label: "トップ", icon: House },
    { href: "/games", label: "探す", icon: Users, requiresAuth: false },
    { href: "/rooms/new", label: "部屋作成", icon: PlusCircle, requiresAuth: true },
    { href: "/rooms/current/chat", label: "参加中", icon: Chat, requiresAuth: true },
    { href: "/users/me", label: "プロフィール", icon: User, requiresAuth: true },
  ];

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 flex items-center justify-around md:hidden"
      style={{
        height: "calc(60px + env(safe-area-inset-bottom))",
        paddingBottom: "env(safe-area-inset-bottom)",
        backgroundColor: "var(--bg-card)",
        borderTop: "1px solid var(--border)",
      }}
    >
      {staticItems.map(({ href, label, icon: Icon, requiresAuth }) => {
        const isActive = href === "/" || href === "/games" ? pathname === href : pathname.startsWith(href);
        const linkStyle = {
          color: isActive ? "var(--accent-light)" : "var(--text-secondary)",
          fontWeight: isActive ? 500 : 400,
        };
        if (requiresAuth && !isAuthenticated) {
          return (
            <Link
              key={href}
              href={href}
              className="relative flex flex-1 flex-col items-center gap-1 px-2 py-2 text-[11px] whitespace-nowrap transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              <Icon className="h-7 w-7" />
              {label}
            </Link>
          );
        }
        return (
          <Link
            key={href}
            href={href}
            className="relative flex flex-1 flex-col items-center gap-1 px-2 py-2 text-[11px] whitespace-nowrap transition-colors"
            style={linkStyle}
          >
            <Icon className="h-7 w-7" />
            {label}
            {isActive && (
              <span
                className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full animate-scale-in"
                style={{ backgroundColor: "var(--accent-light)" }}
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
