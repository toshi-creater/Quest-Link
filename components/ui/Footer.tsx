"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Footer() {
  const pathname = usePathname();
  if (pathname === "/login" || pathname === "/onboarding") return null;

  return (
    <footer
      className="mt-auto py-6 px-4 pb-[calc(60px_+_env(safe-area-inset-bottom))] md:pb-6 text-center"
      style={{
        borderTop: "1px solid var(--border)",
        backgroundColor: "var(--bg-base)",
      }}
    >
      <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 mb-2">
        <Link
          href="/privacy"
          className="text-xs transition-colors hover:text-white"
          style={{ color: "var(--text-muted)" }}
        >
          プライバシーポリシー
        </Link>
        <span className="text-xs select-none" style={{ color: "var(--text-muted)" }} aria-hidden="true">
          ·
        </span>
        <Link
          href="/terms"
          className="text-xs transition-colors hover:text-white"
          style={{ color: "var(--text-muted)" }}
        >
          利用規約
        </Link>
        <span className="text-xs select-none" style={{ color: "var(--text-muted)" }} aria-hidden="true">
          ·
        </span>
        <Link
          href="/contact"
          className="text-xs transition-colors hover:text-white"
          style={{ color: "var(--text-muted)" }}
        >
          お問い合わせ
        </Link>
      </nav>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
        © 2026 QuestLink
      </p>
    </footer>
  );
}
