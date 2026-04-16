"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { NAV_ITEMS } from "@/components/ui/nav-items";

export function BottomNav() {
  const pathname = usePathname();
  const { status } = useSession();

  if (pathname === "/login" || pathname === "/onboarding") return null;

  const isAuthenticated = status === "authenticated";

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
      {NAV_ITEMS.map(({ href, shortLabel, icon: Icon, requiresAuth, isActive: checkActive }) => {
        const isActive = checkActive(pathname);
        const linkStyle = {
          color: isActive ? "var(--accent-light)" : "var(--text-secondary)",
          fontWeight: isActive ? 500 : 400,
        };
        if (requiresAuth && !isAuthenticated) {
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className="relative flex flex-1 flex-col items-center gap-1 px-2 py-2 text-[11px] whitespace-nowrap transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              <Icon className="h-6 w-6" />
              {shortLabel}
            </Link>
          );
        }
        return (
          <Link
            key={href}
            href={href}
            prefetch={true}
            className="flex flex-1 flex-col items-center gap-1 px-2 py-2 text-[11px] whitespace-nowrap transition-colors"
            style={linkStyle}
          >
            <Icon className="h-6 w-6" />
            {shortLabel}
          </Link>
        );
      })}
    </nav>
  );
}
