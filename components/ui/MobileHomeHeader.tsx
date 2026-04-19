"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { Logo } from "@/components/ui/Logo";
import { HeaderSearchBar } from "@/components/ui/HeaderSearchBar";

export function MobileHomeHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [withTransition, setWithTransition] = useState(false);
  const [prevPathname, setPrevPathname] = useState(pathname);

  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setOpen(false);
    setWithTransition(false);
  }

  // withTransition が false のとき次フレームで再有効化 (setState はコールバック内のみ)
  useEffect(() => {
    if (withTransition) return;
    const id = requestAnimationFrame(() => setWithTransition(true));
    return () => cancelAnimationFrame(id);
  }, [withTransition]);

  const t = withTransition;

  return (
    <header
      className="sticky top-0 z-40 border-b md:hidden"
      style={{ backgroundColor: "var(--bg-base)", borderColor: "var(--border)" }}
    >
      <div className="flex h-14 items-center px-4">
        {/* Logo: collapses + fades when search is open */}
        <Link
          href="/"
          aria-hidden={open}
          tabIndex={open ? -1 : 0}
          className={`block shrink-0 overflow-hidden ${
            open ? "max-w-0 opacity-0" : "mr-3 max-w-xs opacity-100"
          } ${t ? "transition-all duration-200 ease-out" : ""}`}
        >
          <Logo height={32} />
        </Link>

        {/* Morph target: icon → search bar in place (grows leftward) */}
        <div className="flex flex-1 justify-end">
          <div
            className={`relative h-10 ${t ? "transition-[width] duration-200 ease-out" : ""}`}
            style={{ width: open ? "100%" : "40px" }}
          >
            {/* Icon view (visible when closed) */}
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="検索を開く"
              aria-hidden={open}
              tabIndex={open ? -1 : 0}
              className={`absolute inset-0 flex items-center justify-center rounded-lg ${
                open ? "pointer-events-none opacity-0" : "opacity-100"
              } ${t ? "transition-opacity duration-150" : ""}`}
              style={{ color: "var(--text-secondary)" }}
            >
              <MagnifyingGlass size={24} weight="bold" />
            </button>

            {/* Search bar view (visible when open) */}
            <div
              aria-hidden={!open}
              className={`absolute inset-0 flex items-center gap-2 ${
                open ? "opacity-100" : "pointer-events-none opacity-0"
              } ${t ? "transition-opacity duration-150" : ""}`}
            >
              <div className="min-w-0 flex-1">
                <HeaderSearchBar />
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="検索を閉じる"
                tabIndex={open ? 0 : -1}
                className="shrink-0 rounded-lg p-2"
                style={{ color: "var(--text-secondary)" }}
              >
                <X size={20} weight="bold" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
