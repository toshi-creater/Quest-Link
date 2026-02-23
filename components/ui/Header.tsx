"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Gamepad2, Users, Menu, X, Zap } from "lucide-react";
import clsx from "clsx";
import { SignOutButton } from "@/components/ui/SignOutButton";

export function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isLoginPage = pathname === "/login";
  if (isLoginPage) return null;

  const navLinks = [
    { href: "/rooms", label: "部屋一覧", icon: Gamepad2 },
    { href: "/users/me", label: "プロフィール", icon: Users },
  ];

  return (
    <header
      className="sticky top-0 z-50 h-16 border-b"
      style={{
        backgroundColor: "rgba(10,10,15,0.92)",
        borderColor: "var(--border)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link href="/rooms" className="flex items-center gap-2 group">
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
        <nav className="hidden items-center gap-1 sm:flex">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={clsx(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
                pathname.startsWith(href)
                  ? "text-white"
                  : "hover:text-white"
              )}
              style={
                pathname.startsWith(href)
                  ? { backgroundColor: "rgba(124,58,237,0.2)", color: "var(--accent-light)" }
                  : { color: "var(--text-secondary)" }
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
          <div className="mx-2 h-6 w-px" style={{ backgroundColor: "var(--border)" }} />
          <SignOutButton />
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="flex items-center justify-center rounded-lg p-2 sm:hidden"
          style={{ color: "var(--text-secondary)" }}
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="メニュー"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          className="border-t sm:hidden"
          style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border)" }}
        >
          <nav className="flex flex-col gap-1 p-3">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium"
                style={
                  pathname.startsWith(href)
                    ? { backgroundColor: "rgba(124,58,237,0.15)", color: "var(--accent-light)" }
                    : { color: "var(--text-secondary)" }
                }
                onClick={() => setMobileOpen(false)}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
            <SignOutButton />
          </nav>
        </div>
      )}
    </header>
  );
}
