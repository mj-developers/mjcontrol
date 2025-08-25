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
import IconCircle from "@/components/ui/IconCircle";
import type { Theme } from "./DesktopNav";

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
  const circleBaseProps = {
    theme,
    size: "md" as const,
    borderWidth: 2,
    borderColor: { light: NORMAL_BORDER, dark: NORMAL_BORDER },
    bg: { light: NORMAL_BG, dark: NORMAL_BG },
    fillOnHover: true,
    hoverEffect: "none" as const,
    zoomOnHover: false,
  };

  const rowBase = "group flex items-center justify-center h-16";
  const IconRail = ({ children }: { children: ReactNode }) => (
    <div className="w-20 flex-none grid place-items-center">{children}</div>
  );

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }
  function iconCls(active: boolean) {
    const zoom = active ? "" : "transition-transform group-hover:scale-[1.15]";
    if (theme === "light") {
      return [
        "block",
        zoom,
        active ? "text-white" : "text-[#010409]",
        active ? "" : "group-hover:text-white",
      ].join(" ");
    }
    return [
      "block",
      zoom,
      active ? "text-[#0b0b0d]" : "text-white",
      active ? "" : "group-hover:text-[#0b0b0d]",
    ].join(" ");
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
          <IconCircle {...circleBaseProps} accent={accent} active={active}>
            <Icon className={iconCls(active)} />
          </IconCircle>
        </IconRail>
      </Link>
    );
  };

  // Skeleton en SSR sin vars de tema
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
          {/* Tema */}
          <button
            type="button"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label="Cambiar tema"
            className="group"
          >
            <IconCircle
              {...circleBaseProps}
              fillOnHover={false}
              className={
                theme === "dark"
                  ? "group-hover:bg-white group-hover:border-white"
                  : "group-hover:bg-[#18181b] group-hover:border-[#18181b]"
              }
            >
              <span
                className="relative"
                style={{
                  width: "var(--icon-size)",
                  height: "var(--icon-size)",
                }}
              >
                <Sun
                  className={[
                    "absolute inset-0 block w-full h-full transition-opacity",
                    theme === "light"
                      ? "opacity-100 group-hover:opacity-0 text-[#010409]"
                      : "opacity-0 group-hover:opacity-100 text-black",
                  ].join(" ")}
                />
                <Moon
                  className={[
                    "absolute inset-0 block w-full h-full transition-opacity",
                    theme === "dark"
                      ? "opacity-100 group-hover:opacity-0 text-white"
                      : "opacity-0 group-hover:opacity-100 text-white",
                  ].join(" ")}
                />
              </span>
            </IconCircle>
          </button>

          {/* Logout */}
          <Link href="/logout" className="group">
            <IconCircle
              {...circleBaseProps}
              fillOnHover={false}
              bg={BRAND}
              className="group-hover:border-[var(--item-accent)]"
            >
              <LogOut className="block text-white transition-transform group-hover:scale-[1.15]" />
            </IconCircle>
          </Link>
        </div>
      </nav>
    </aside>
  );
}
