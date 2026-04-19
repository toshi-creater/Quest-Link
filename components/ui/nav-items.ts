import { House, PlusCircle, Chat, User, Users, Icon, Door, GameControllerIcon, MagnifyingGlassIcon, Plus, ChatText } from "@phosphor-icons/react";
import type { ComponentType } from "react";

export type NavItem = {
  href: string;
  /** デスクトップ用ラベル */
  label: string;
  /** モバイル用短縮ラベル */
  shortLabel: string;
  icon: Icon;
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
    icon: MagnifyingGlassIcon,
    requiresAuth: false,
    isActive: (p) => p === "/games" || p.startsWith("/games/"),
  },
  {
    href: "/rooms/new",
    label: "部屋作成",
    shortLabel: "部屋作成",
    icon: Plus,
    requiresAuth: true,
    isActive: (p) => p === "/rooms/new",
  },
  {
    href: "/rooms/current/chat",
    label: "参加中の部屋",
    shortLabel: "参加中",
    icon: ChatText,
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

export const DESKTOP_NAV_ITEMS: NavItem[] = NAV_ITEMS.filter(
  (item) => item.href === "/games" || item.href === "/rooms/new"
);
