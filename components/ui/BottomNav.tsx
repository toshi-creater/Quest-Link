"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Home, PlusCircle, MessageSquare, User, Users } from "lucide-react";
import { LoginModal } from "@/components/ui/LoginModal";

export function BottomNav() {
  const pathname = usePathname();
  const { status } = useSession();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  if (pathname === "/login") return null;

  const isAuthenticated = status === "authenticated";

  const staticItems = [
    { href: "/", label: "トップ", icon: Home },
    { href: "/games", label: "探す", icon: Users, requiresAuth: false },
    { href: "/rooms/new", label: "部屋作成", icon: PlusCircle, requiresAuth: true },
    { href: "/rooms/current/chat", label: "参加中", icon: MessageSquare, requiresAuth: true },
    { href: "/users/me", label: "プロフィール", icon: User, requiresAuth: true },
  ];

  return (
    <>
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
          if (requiresAuth && !isAuthenticated) {
            return (
              <button
                key={href}
                onClick={() => setLoginModalOpen(true)}
                className="flex flex-1 flex-col items-center gap-1 px-2 py-2 text-[10px] font-light transition-colors"
                style={{ color: "var(--text-secondary)" }}
              >
                <Icon className="h-5 w-5" />
                {label}
              </button>
            );
          }
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center gap-1 px-2 py-2 text-[10px] font-light transition-colors"
              style={{ color: isActive ? "var(--accent-light)" : "var(--text-secondary)" }}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>

      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
  );
}
