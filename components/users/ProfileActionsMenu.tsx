"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { DotsThree, DotsThreeVertical } from "@phosphor-icons/react";
import { SignOutButton } from "@/components/ui/SignOutButton";

export function ProfileActionsMenu() {
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

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((prev) => !prev)}
        aria-label="メニューを開く"
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-[rgba(124,58,237,0.1)]"
        style={{ color: "var(--text-secondary)" }}
      >
        <DotsThree size={28} weight="bold" />
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
