"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useSession } from "next-auth/react";
import { Home, PlusCircle, MessageSquare, User, Zap, Users } from "lucide-react";
import clsx from "clsx";
import { SignOutButton } from "@/components/ui/SignOutButton";
import { LoginModal } from "@/components/ui/LoginModal";

export function Header() {
  const pathname = usePathname();
  const { status } = useSession();
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  if (pathname === "/login") return null;

  const isAuthenticated = status === "authenticated";

  const staticNavItems = [
    { href: "/", label: "トップ", icon: Home, requiresAuth: false },
    { href: "/games", label: "部屋を探す", icon: Users, requiresAuth: false },
    { href: "/rooms/new", label: "部屋作成", icon: PlusCircle, requiresAuth: true },
    { href: "/rooms/current/chat", label: "参加中の部屋", icon: MessageSquare, requiresAuth: true },
    { href: "/users/me", label: "プロフィール", icon: User, requiresAuth: true },
  ];

  return (
    <>
      <header
        className="sticky top-0 z-50 h-16 border-b block"
        style={{
          backgroundColor: "rgba(10,10,15,0.92)",
          borderColor: "var(--border)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg transition-all group-hover:scale-110"
              style={{ background: "linear-gradient(135deg, var(--accent), var(--accent-light))" }}
            >
              <Zap className="h-4 w-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
              Quest<span style={{ color: "var(--accent-light)" }}>Link</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {staticNavItems.map(({ href, label, icon: Icon, requiresAuth }) => {
              const isActive = href === "/" || href === "/games" ? pathname === href : pathname.startsWith(href);
              if (requiresAuth && !isAuthenticated) {
                return (
                  <button
                    key={href}
                    onClick={() => setLoginModalOpen(true)}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-white"
                    style={{ color: "var(--text-secondary)" }}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </button>
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

      <LoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </>
  );
}
