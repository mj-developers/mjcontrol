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
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
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

export default function MobileNav({
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

  // deja hueco inferior para la barra
  useEffect(() => {
    if (!mounted) return;
    const height = 72;
    document.body.style.setProperty(
      "padding-bottom",
      `calc(${height}px + env(safe-area-inset-bottom))`
    );
    return () => {
      document.body.style.removeProperty("padding-bottom");
    };
  }, [mounted]);

  // shell contenedor
  const SHELL_BG = theme === "light" ? "#e2e5ea" : "#0d1117";
  const SHELL_BORDER = theme === "light" ? "#0b0b0d" : "#ffffff";
  const SHELL_FG = theme === "light" ? "#0b0b0d" : "#ffffff";
  const shell =
    "bg-[var(--shell-bg)] text-[var(--shell-fg)] border-[var(--shell-border)]";

  // paleta de círculos
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
      <Link href={href} className="group grid place-items-center">
        <IconMark
          size="md"
          borderWidth={2}
          interactive
          hoverAnim={active ? "none" : "zoom"}
          style={markStyle(active, accent)}
        >
          <Icon />
        </IconMark>
      </Link>
    );
  };

  // Shell vacío durante SSR/primer render del cliente
  if (!mounted) {
    return (
      <nav
        className={[
          "fixed inset-x-0 bottom-0 z-40",
          "h-[72px] border-t",
          "bg-[var(--shell-bg)] text-[var(--shell-fg)] border-[var(--shell-border)]",
          "px-3",
        ].join(" ")}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Barra de navegación (móvil)"
      />
    );
  }

  return (
    <nav
      className={[
        "fixed inset-x-0 bottom-0 z-40",
        "h-[72px] border-t",
        shell,
        "px-3",
      ].join(" ")}
      style={
        {
          paddingBottom: "env(safe-area-inset-bottom)",
          "--shell-bg": SHELL_BG,
          "--shell-border": SHELL_BORDER,
          "--shell-fg": SHELL_FG,
        } as StyleWithVars
      }
      aria-label="Barra de navegación (móvil)"
    >
      <div
        className={[
          "h-full grid place-items-center gap-2",
          settingsOpen ? "grid-cols-3" : "grid-cols-6",
        ].join(" ")}
      >
        {settingsOpen ? (
          <>
            {/* Tema (animación cycle, icono dinámico) */}
            <button
              type="button"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label="Cambiar tema"
              className="group grid place-items-center"
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
            <Link href="/logout" className="group grid place-items-center">
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

            {/* Volver */}
            <button
              type="button"
              aria-label="Volver"
              className="group grid place-items-center"
              onClick={() => setSettingsOpen(false)}
            >
              <IconMark
                size="md"
                borderWidth={2}
                interactive
                hoverAnim="zoom"
                style={markStyle(false, BRAND)}
              >
                <ArrowLeft />
              </IconMark>
            </button>
          </>
        ) : (
          <>
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
            {/* Engranaje */}
            <button
              type="button"
              aria-label="Ajustes"
              className="group grid place-items-center"
              onClick={() => setSettingsOpen(true)}
            >
              <IconMark
                size="md"
                borderWidth={2}
                interactive
                hoverAnim="zoom"
                style={markStyle(false, BRAND)}
              >
                <Settings />
              </IconMark>
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
