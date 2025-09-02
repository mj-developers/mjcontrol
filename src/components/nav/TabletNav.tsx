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
  Settings,
  ArrowLeft,
  Table2,
  type LucideIcon,
} from "lucide-react";
import { CSSProperties, ReactNode, useEffect, useState } from "react";
import IconMark from "@/components/ui/IconMark";
import type { Theme } from "@/lib/theme";

const ACCENT: Record<string, string> = {
  "/": "#6366F1",
  "/users": "#06B6D4",
  "/clients": "#F59E0B",
  "/applications": "#8B5CF6",
  "/licenses": "#10B981",
};
const BRAND = "#8E2434";
const AUX_BROWN = "#8B5E3C";
const ZOOM_SCALE = 1.5;

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

  const [settingsOpen, setSettingsOpen] = useState(false);

  // Mantener padding izquierdo en tablet
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--nav-w", "5rem");
    return () => {
      root.style.removeProperty("--nav-w");
    };
  }, []);

  const SHELL_BG = theme === "light" ? "#e2e5ea" : "#0d1117";
  const SHELL_BORDER = theme === "light" ? "#0b0b0d" : "#ffffff";
  const SHELL_FG = theme === "light" ? "#0b0b0d" : "#ffffff";

  const GEAR_BG = theme === "light" ? "#8893A2" : "#565D66";
  const GEAR_HOV = theme === "light" ? "#7C8898" : "#626A74";

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
  const FG_ACTIVE = theme === "light" ? "#0b0b0d" : "#ffffff";
  const FG_NORMAL = theme === "light" ? "#010409" : "#ffffff";

  function markStyle(active: boolean, accent: string): MarkVars {
    return {
      "--mark-bg": active ? accent : NORMAL_BG,
      "--mark-border": active ? accent : NORMAL_BORDER,
      "--mark-fg": active ? FG_ACTIVE : FG_NORMAL,
      "--iconmark-hover-bg": accent,
      "--iconmark-hover-border": accent,
      "--iconmark-hover-icon-fg": FG_ACTIVE,
    };
  }
  function markSettings(active: boolean): MarkVars {
    return {
      "--mark-bg": active ? GEAR_BG : NORMAL_BG,
      "--mark-border": active ? GEAR_BG : NORMAL_BORDER,
      "--mark-fg": FG_NORMAL,
      "--iconmark-hover-bg": GEAR_HOV,
      "--iconmark-hover-border": GEAR_HOV,
      "--iconmark-hover-icon-fg": FG_NORMAL,
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
        aria-current={active ? "page" : undefined}
      >
        <IconRail>
          <IconMark
            size="md"
            borderWidth={2}
            interactive
            hoverAnim={active ? "none" : "zoom"}
            className={active ? "is-active" : undefined}
            style={markStyle(active, accent)}
          >
            <Icon className="h-5 w-5" />
          </IconMark>
        </IconRail>
      </Link>
    );
  };

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
      <style jsx global>{`
        .mj-iconmark.is-active .icon-default {
          transform: scale(${ZOOM_SCALE}) !important;
        }
      `}</style>

      <nav className="relative flex h-full flex-col">
        {/* La lista principal SIEMPRE visible (portrait y landscape) */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-0 py-4">
          <div className="h-full flex flex-col items-center justify-center gap-2">
            <Item href="/" Icon={Gauge} accent={ACCENT["/"]} />
            <Item href="/users" Icon={Users} accent={ACCENT["/users"]} />
            <Item
              href="/clients"
              Icon={Building2}
              accent={ACCENT["/clients"]}
            />
            <Item
              href="/applications"
              Icon={AppWindow}
              accent={ACCENT["/applications"]}
            />
            <Item
              href="/licenses"
              Icon={BadgeCheck}
              accent={ACCENT["/licenses"]}
            />
          </div>
        </div>

        {/* Overlay igual que portrait: Auxiliares arriba, Tema debajo */}
        {settingsOpen && (
          <div className="absolute left-0 right-0 bottom-[6.75rem] px-0 py-2 z-50">
            <div className="grid place-items-center gap-3">
              <Link href="/aux" aria-label="Auxiliares">
                <IconMark
                  size="md"
                  borderWidth={2}
                  interactive
                  hoverAnim="zoom"
                  style={markStyle(false, AUX_BROWN)}
                >
                  <Table2 className="h-5 w-5" />
                </IconMark>
              </Link>

              <button
                type="button"
                aria-label="Cambiar tema"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              >
                <IconMark
                  size="md"
                  borderWidth={2}
                  interactive
                  hoverAnim="cycle"
                  style={markSettings(false)}
                  icon={
                    theme === "dark" ? (
                      <Moon className="h-5 w-5" />
                    ) : (
                      <Sun className="h-5 w-5" />
                    )
                  }
                  hoverIcon={
                    theme === "dark" ? (
                      <Sun className="h-5 w-5" />
                    ) : (
                      <Moon className="h-5 w-5" />
                    )
                  }
                />
              </button>
            </div>
          </div>
        )}

        {/* Ajustes (cambia a flecha) y Logout: fijos abajo */}
        <div className="px-0 py-3 grid place-items-center gap-2 relative z-40">
          <button
            type="button"
            aria-label={settingsOpen ? "Volver" : "Ajustes"}
            className="group"
            onClick={() => setSettingsOpen((v) => !v)}
          >
            <IconMark
              size="md"
              borderWidth={2}
              interactive
              hoverAnim="zoom"
              className={settingsOpen ? "is-active" : undefined}
              style={markSettings(settingsOpen)}
            >
              {settingsOpen ? (
                <ArrowLeft className="h-5 w-5" />
              ) : (
                <Settings className="h-5 w-5" />
              )}
            </IconMark>
          </button>

          <Link href="/logout" className="group" aria-label="Logout">
            <IconMark
              size="md"
              borderWidth={2}
              interactive
              hoverAnim="zoom"
              style={markStyle(true, BRAND)}
            >
              <LogOut className="h-5 w-5" />
            </IconMark>
          </Link>
        </div>
      </nav>
    </aside>
  );
}
