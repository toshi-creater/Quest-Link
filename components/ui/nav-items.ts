import { House, PlusCircle, Chat, User, Users } from "@phosphor-icons/react";
import type { ComponentType } from "react";

export type NavItem = {
  href: string;
  /** デスクトップ用ラベル */
  label: string;
  /** モバイル用短縮ラベル */
  shortLabel: string;
  icon: ComponentType<{ className?: string }>;
  requiresAuth: boolean;
  isActive: (pathname: string) => boolean;
};

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "トップ",
    shortLabel: "トップ",
    icon: House,
    requiresAuth: false,
    isActive: (p) => p === "/",
  },
  {
    href: "/games",
    label: "部屋を探す",
    shortLabel: "探す",
    icon: Users,
    requiresAuth: false,
    isActive: (p) => p === "/games" || p.startsWith("/games/"),
  },
  {
    href: "/rooms/new",
    label: "部屋作成",
    shortLabel: "部屋作成",
    icon: PlusCircle,
    requiresAuth: true,
    isActive: (p) => p === "/rooms/new",
  },
  {
    href: "/rooms/current/chat",
    label: "参加中の部屋",
    shortLabel: "参加中",
    icon: Chat,
    requiresAuth: true,
    isActive: (p) => p.startsWith("/rooms/") && !p.startsWith("/rooms/new"),
  },
  {
    href: "/users/me",
    label: "プロフィール",
    shortLabel: "プロフィール",
    icon: User,
    requiresAuth: true,
    isActive: (p) => p.startsWith("/users/me"),
  },
];
