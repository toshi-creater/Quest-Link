"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { SignOutButton } from "@/components/ui/SignOutButton";

export function UserAvatarMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!session?.user) return null;

  const { username, iconUrl } = session.user;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="ユーザーメニューを開く"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center rounded-full ring-2 ring-transparent transition-all hover:ring-violet-600 hover:opacity-80 data-[open=true]:ring-violet-600"
        data-open={open}
      >
        <UserAvatar username={username} iconUrl={iconUrl} size="md" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 w-48 rounded-xl border py-1 shadow-lg"
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border)",
            zIndex: 60,
          }}
        >
          <Link
            href="/users/me"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center px-4 py-2 text-sm transition-all hover:text-white hover:bg-[rgba(124,58,237,0.1)]"
            style={{ color: "var(--text-secondary)" }}
          >
            プロフィール
          </Link>
          <Link
            href="/users/me/edit"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center px-4 py-2 text-sm transition-all hover:text-white hover:bg-[rgba(124,58,237,0.1)]"
            style={{ color: "var(--text-secondary)" }}
          >
            プロフィール編集
          </Link>
          <Link
            href="/users/me/history"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="flex items-center px-4 py-2 text-sm transition-all hover:text-white hover:bg-[rgba(124,58,237,0.1)]"
            style={{ color: "var(--text-secondary)" }}
          >
            参加履歴
          </Link>
          <div
            className="my-1 border-t"
            style={{ borderColor: "var(--border)" }}
          />
          <div role="menuitem">
            <SignOutButton />
          </div>
        </div>
      )}
    </div>
  );
}
