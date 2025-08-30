"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gauge,
  Users,
  Building2,
  AppWindow,
  BadgeCheck,
  LogOut,
  Sun,
  Moon,
  type LucideIcon,
} from "lucide-react";
import { CSSProperties, ReactNode, useEffect, useState } from "react";
import IconMark from "@/components/ui/IconMark";
import type { Theme } from "@/lib/theme";

const ACCENT: Record<string, string> = {
  "/": "#6366F1",
  "/users": "#06B6D4",
  "/clients": "#F59E0B",
  "/apps": "#8B5CF6",
  "/licenses": "#10B981",
};
const BRAND = "#8E2434";

type StyleWithVars = CSSProperties & {
  ["--nav-w"]?: string;
  ["--item-accent"]?: string;
  ["--shell-bg"]?: string;
  ["--shell-fg"]?: string;
  ["--shell-border"]?: string;
};

type MarkVars = CSSProperties & {
  ["--mark-bg"]?: string;
  ["--mark-border"]?: string;
  ["--mark-fg"]?: string;
  ["--iconmark-hover-bg"]?: string;
  ["--iconmark-hover-border"]?: string;
  ["--iconmark-hover-icon-fg"]?: string;
};

export default function TabletNav({
  theme,
  setTheme,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
}) {
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const SHELL_BG = theme === "light" ? "#e2e5ea" : "#0d1117";
  const SHELL_BORDER = theme === "light" ? "#0b0b0d" : "#ffffff";
  const SHELL_FG = theme === "light" ? "#0b0b0d" : "#ffffff";

  const shell =
    "bg-[var(--shell-bg)] text-[var(--shell-fg)] border-[var(--shell-border)]";
  const RAIL = "5rem";

  const baseVars: StyleWithVars = { "--nav-w": RAIL };
  const themeVars: Partial<StyleWithVars> = mounted
    ? {
        ["--shell-bg"]: SHELL_BG,
        ["--shell-border"]: SHELL_BORDER,
        ["--shell-fg"]: SHELL_FG,
      }
    : {};
  const navVars: StyleWithVars = { ...baseVars, ...themeVars };

  const NORMAL_BORDER = theme === "light" ? "#0e1117" : "#ffffff";
  const NORMAL_BG = theme === "light" ? "#e2e5ea" : "#0b0b0d";

  function markStyle(active: boolean, accent: string): MarkVars {
    const fgNormal = theme === "light" ? "#010409" : "#ffffff";
    const fgActive = theme === "light" ? "#ffffff" : "#0b0b0d";
    return {
      "--mark-bg": active ? accent : NORMAL_BG,
      "--mark-border": active ? accent : NORMAL_BORDER,
      "--mark-fg": active ? fgActive : fgNormal,
      "--iconmark-hover-bg": accent,
      "--iconmark-hover-border": accent,
      "--iconmark-hover-icon-fg": fgActive,
    };
  }

  const rowBase = "group flex items-center justify-center h-16";
  const IconRail = ({ children }: { children: ReactNode }) => (
    <div className="w-20 flex-none grid place-items-center">{children}</div>
  );

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }

  const Item = ({
    href,
    Icon,
    accent,
  }: {
    href: string;
    Icon: LucideIcon;
    accent: string;
  }) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        className={rowBase}
        style={{ "--item-accent": accent } as StyleWithVars}
      >
        <IconRail>
          <IconMark
            size="md"
            borderWidth={2}
            interactive
            hoverAnim={active ? "none" : "zoom"}
            style={markStyle(active, accent)}
          >
            <Icon />
          </IconMark>
        </IconRail>
      </Link>
    );
  };

  // Skeleton SSR
  if (!mounted) {
    return (
      <aside
        className={[
          "fixed left-0 top-0 z-40 h-screen border-r",
          shell,
          "w-[var(--nav-w)]",
        ].join(" ")}
        style={baseVars}
        aria-label="Barra de navegación (tablet)"
      />
    );
  }

  return (
    <aside
      className={[
        "fixed left-0 top-0 z-40 h-screen border-r",
        shell,
        "w-[var(--nav-w)]",
      ].join(" ")}
      style={navVars}
      aria-label="Barra de navegación (tablet)"
    >
      <nav className="flex h-full flex-col">
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-0 py-4">
          <div className="h-full flex flex-col items-center justify-center gap-2">
            <Item href="/" Icon={Gauge} accent={ACCENT["/"]} />
            <Item href="/users" Icon={Users} accent={ACCENT["/users"]} />
            <Item
              href="/clients"
              Icon={Building2}
              accent={ACCENT["/clients"]}
            />
            <Item href="/apps" Icon={AppWindow} accent={ACCENT["/apps"]} />
            <Item
              href="/licenses"
              Icon={BadgeCheck}
              accent={ACCENT["/licenses"]}
            />
          </div>
        </div>

        <div className="px-0 py-3 grid place-items-center gap-2">
          {/* Tema (cycle) */}
          <button
            type="button"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label="Cambiar tema"
            className="group"
          >
            <IconMark
              size="md"
              borderWidth={2}
              interactive
              hoverAnim="cycle"
              style={markStyle(false, BRAND)}
              icon={theme === "dark" ? <Moon /> : <Sun />}
              hoverIcon={theme === "dark" ? <Sun /> : <Moon />}
            />
          </button>

          {/* Logout (zoom) */}
          <Link href="/logout" className="group">
            <IconMark
              size="md"
              borderWidth={2}
              interactive
              hoverAnim="zoom"
              style={markStyle(true, BRAND)}
            >
              <LogOut />
            </IconMark>
          </Link>
        </div>
      </nav>
    </aside>
  );
}
