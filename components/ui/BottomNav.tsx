"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { NAV_ITEMS } from "@/components/ui/nav-items";
import { UserAvatar } from "@/components/ui/UserAvatar";

export function BottomNav() {
  const pathname = usePathname();
  const { status, data: session } = useSession();

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

        const isProfileItem = href === "/users/me";

        const iconEl =
          isProfileItem && isAuthenticated && session?.user ? (
            <UserAvatar
              username={session.user.username}
              iconUrl={session.user.iconUrl}
              size="sm"
            />
          ) : (
            <Icon size={24} weight="bold" />
          );

        if (requiresAuth && !isAuthenticated) {
          return (
            <Link
              key={href}
              href={href}
              prefetch={true}
              className="relative flex flex-1 flex-col items-center gap-1 px-2 py-2 text-[11px] whitespace-nowrap transition-colors"
              style={{ color: "var(--text-secondary)" }}
            >
              {iconEl}
              {/* {shortLabel} */}
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
            {iconEl}
            {/* {shortLabel} */}
          </Link>
        );
      })}
    </nav>
  );
}
