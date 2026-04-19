"use client";

import { signOut } from "next-auth/react";
import { SignOut } from "@phosphor-icons/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => void signOut({ callbackUrl: "/login" })}
      className="flex w-full items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all hover:text-red-400 hover:bg-red-500/10"
      style={{ color: "var(--text-secondary)" }}
    >
      <SignOut className="h-4 w-4" />
      ログアウト
    </button>
  );
}
