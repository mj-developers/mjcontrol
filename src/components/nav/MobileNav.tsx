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
  ["--shell-bg"]?: string;
  ["--shell-fg"]?: string;
  ["--shell-border"]?: string;
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

  // vars del shell (colores del contenedor)
  const SHELL_BG = theme === "light" ? "#e2e5ea" : "#0d1117";
  const SHELL_BORDER = theme === "light" ? "#0b0b0d" : "#ffffff";
  const SHELL_FG = theme === "light" ? "#0b0b0d" : "#ffffff";

  const shell =
    "bg-[var(--shell-bg)] text-[var(--shell-fg)] border-[var(--shell-border)]";

  // paleta de círculos (estado normal)
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

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  }
  function iconCls(active: boolean) {
    const zoom = active ? "" : "transition-transform group-hover:scale-[1.15]";
    if (theme === "light")
      return [
        "block",
        zoom,
        active ? "text-white" : "text-[#010409]",
        active ? "" : "group-hover:text-white",
      ].join(" ");
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
      <Link href={href} className="group grid place-items-center">
        <IconCircle {...circleBaseProps} accent={accent} active={active}>
          <Icon className={iconCls(active)} />
        </IconCircle>
      </Link>
    );
  };

  // Shell vacío durante SSR/primer render del cliente (sin vars de tema)
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
        "bg-[var(--shell-bg)] text-[var(--shell-fg)] border-[var(--shell-border)]",
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
            {/* Tema */}
            <button
              type="button"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              aria-label="Cambiar tema"
              className="group grid place-items-center"
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
                  className="relative transition-transform group-hover:scale-[1.15]"
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
            <Link href="/logout" className="group grid place-items-center">
              <IconCircle
                {...circleBaseProps}
                fillOnHover={false}
                bg={BRAND}
                className="group-hover:border-[#8E2434]"
              >
                <LogOut className="block text-white transition-transform group-hover:scale-[1.15]" />
              </IconCircle>
            </Link>

            {/* Volver */}
            <button
              type="button"
              aria-label="Volver"
              className="group grid place-items-center"
              onClick={() => setSettingsOpen(false)}
            >
              <IconCircle {...circleBaseProps} accent={BRAND} active={false}>
                <ArrowLeft className={iconCls(false)} />
              </IconCircle>
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
              <IconCircle {...circleBaseProps} accent={BRAND} active={false}>
                <Settings className={iconCls(false)} />
              </IconCircle>
            </button>
          </>
        )}
      </div>
    </nav>
  );
}
