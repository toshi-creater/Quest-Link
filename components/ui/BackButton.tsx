"use client";

import { CaretLeft } from "@phosphor-icons/react";
import Link from "next/link";

type BackButtonProps = {
    href: string
    className?: string
}

export function BackButton({ href, className }: BackButtonProps) {
    return (
        <Link
            href={href}
            aria-label="戻る"
            className={`flex items-center gap-2 text-xl font-bold transition-colors hover:opacity-80 sm:text-2xl ${className}`}
            style={{ color: "var(--text-primary)" }}
        >
            <CaretLeft size={28} weight="bold" />
        </Link>
    );
}
