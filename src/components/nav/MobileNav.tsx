// src/components/nav/MobileNav.tsx
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
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type CSSProperties } from "react";
import IconMark from "@/components/ui/IconMark";
import type { Theme } from "@/lib/theme";

const ACCENT: Record<string, string> = {
  "/": "#6366F1",
  "/users": "#06B6D4",
  "/clients": "#F59E0B",
  "/applications": "#8B5CF6",
  "/licenses": "#10B981",
  "/aux": "#8B5E3C",
};
const BRAND = "#8E2434";
const ZOOM_SCALE = 1.5;

// === helpers ===
function useIsLandscape() {
  const [land, setLand] = useState(false);
  useEffect(() => {
    const update = () => setLand(window.innerWidth > window.innerHeight);
    update();
    window.addEventListener("resize", update);
    const mql = window.matchMedia("(orientation: landscape)");
    const onChange = () => update();
    if ("addEventListener" in mql) {
      mql.addEventListener("change", onChange);
      return () => {
        window.removeEventListener("resize", update);
        mql.removeEventListener("change", onChange);
      };
    }
    // @ts-expect-error addListener: API legacy para Safari/WebKit antiguos
    mql.addListener(onChange);
    return () => {
      window.removeEventListener("resize", update);
      // @ts-expect-error removeListener: API legacy para Safari/WebKit antiguos
      mql.removeListener(onChange);
    };
  }, []);
  return land;
}

type ShellVars = CSSProperties & {
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
  const isLandscape = useIsLandscape();

  const [mounted, setMounted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => setMounted(true), []);

  // Publica padding según orientación y --nav-w en landscape
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    const H = 72;

    if (isLandscape) {
      // rail lateral para móvil landscape
      document.body.style.removeProperty("padding-bottom");
      root.style.setProperty("--nav-w", "5rem");
    } else {
      // barra inferior para móvil portrait
      root.style.removeProperty("--nav-w");
      document.body.style.setProperty(
        "padding-bottom",
        `calc(${H}px + env(safe-area-inset-bottom))`
      );
    }
    return () => {
      root.style.removeProperty("--nav-w");
      document.body.style.removeProperty("padding-bottom");
    };
  }, [mounted, isLandscape]);

  // Paleta dependiendo del tema
  const SHELL_BG = theme === "light" ? "#e2e5ea" : "#0d1117";
  const SHELL_BORDER = theme === "light" ? "#0b0b0d" : "#ffffff";
  const SHELL_FG = theme === "light" ? "#0b0b0d" : "#ffffff";
  const shell =
    "bg-[var(--shell-bg)] text-[var(--shell-fg)] border-[var(--shell-border)]";

  const NORMAL_BORDER = theme === "light" ? "#0e1117" : "#ffffff";
  const NORMAL_BG = theme === "light" ? "#e2e5ea" : "#0b0b0d";
  const FG_NORMAL = theme === "light" ? "#010409" : "#ffffff";
  const FG_ACTIVE = theme === "light" ? "#ffffff" : "#0b0b0d";

  const GEAR_BG = theme === "light" ? "#8893A2" : "#565D66";
  const GEAR_HOVER = theme === "light" ? "#7C8898" : "#626A74";

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
  function markTheme(): MarkVars {
    return {
      "--mark-bg": NORMAL_BG,
      "--mark-border": NORMAL_BORDER,
      "--mark-fg": FG_NORMAL,
      "--iconmark-hover-bg": theme === "light" ? "#0b0b0d" : "#e2e5ea",
      "--iconmark-hover-border": theme === "light" ? "#0b0b0d" : "#e2e5ea",
      "--iconmark-hover-icon-fg": theme === "light" ? "#ffffff" : "#0b0b0d",
    };
  }
  function markGear(active: boolean): MarkVars {
    return {
      "--mark-bg": active ? GEAR_BG : NORMAL_BG,
      "--mark-border": active ? GEAR_BG : NORMAL_BORDER,
      "--mark-fg": FG_NORMAL,
      "--iconmark-hover-bg": GEAR_HOVER,
      "--iconmark-hover-border": GEAR_HOVER,
      "--iconmark-hover-icon-fg": FG_NORMAL,
    };
  }
  function markLogout(): MarkVars {
    return {
      "--mark-bg": BRAND,
      "--mark-border": BRAND,
      "--mark-fg": "#ffffff",
      "--iconmark-hover-bg": BRAND,
      "--iconmark-hover-border": BRAND,
      "--iconmark-hover-icon-fg": "#ffffff",
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
    className,
    hidden = false,
  }: {
    href: string;
    Icon: LucideIcon;
    accent: string;
    className?: string;
    hidden?: boolean;
  }) => {
    const active = isActive(href);
    return (
      <Link
        href={href}
        className={[
          "group grid place-items-center",
          hidden ? "invisible pointer-events-none" : "",
          className ?? "",
        ].join(" ")}
        aria-current={active ? "page" : undefined}
      >
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
      </Link>
    );
  };

  // =======================
  //   LANDSCAPE (rail)
  // =======================
  if (mounted && isLandscape) {
    const hideMain = settingsOpen; // en móvil landscape ocultamos secciones al abrir ajustes
    return (
      <aside
        className={[
          "fixed left-0 top-0 z-40 h-screen border-r",
          shell,
          "w-[var(--nav-w,5rem)]",
        ].join(" ")}
        style={
          {
            "--shell-bg": SHELL_BG,
            "--shell-border": SHELL_BORDER,
            "--shell-fg": SHELL_FG,
          } as ShellVars
        }
        aria-label="Barra de navegación (móvil · landscape)"
      >
        <style jsx global>{`
          .mj-iconmark.is-active .icon-default {
            transform: scale(${ZOOM_SCALE}) !important;
          }
        `}</style>

        <nav className="relative flex h-full flex-col">
          {/* lista principal (ocultable) */}
          <div className="flex-1 min-h-0 overflow-y-auto px-0 py-4">
            <div className="h-full flex flex-col items-center justify-center gap-2">
              <Item
                href="/"
                Icon={Gauge}
                accent={ACCENT["/"]}
                hidden={hideMain}
              />
              <Item
                href="/users"
                Icon={Users}
                accent={ACCENT["/users"]}
                hidden={hideMain}
              />
              <Item
                href="/clients"
                Icon={Building2}
                accent={ACCENT["/clients"]}
                hidden={hideMain}
              />
              <Item
                href="/applications"
                Icon={AppWindow}
                accent={ACCENT["/applications"]}
                hidden={hideMain}
              />
              <Item
                href="/licenses"
                Icon={BadgeCheck}
                accent={ACCENT["/licenses"]}
                hidden={hideMain}
              />
            </div>
          </div>

          {/* overlay con Aux/Tema (aparece sobre el rail) */}
          {settingsOpen && (
            <div className="absolute left-0 right-0 bottom-[6.75rem] z-50">
              {/* 👇 cambio: mismo gap que la columna + margen inferior extra para separar de “Volver” */}
              <div className="grid place-items-center gap-2 mb-2">
                <Link href="/aux" aria-label="Auxiliares" className="group">
                  <IconMark
                    size="md"
                    borderWidth={2}
                    interactive
                    hoverAnim="zoom"
                    style={markStyle(false, ACCENT["/aux"])}
                  >
                    <LayoutGrid className="h-5 w-5" />
                  </IconMark>
                </Link>

                <button
                  type="button"
                  aria-label="Cambiar tema"
                  className="group"
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                >
                  <IconMark
                    size="md"
                    borderWidth={2}
                    interactive
                    hoverAnim="cycle"
                    style={markTheme()}
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

          {/* fijo abajo: Ajustes/Volver y Logout */}
          {/* pt-2 mantiene la simetría de separación inferior */}
          <div className="px-0 pt-2 pb-3 grid place-items-center gap-2 relative z-40">
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
                style={markGear(settingsOpen)}
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
                style={markLogout()}
              >
                <LogOut className="h-5 w-5" />
              </IconMark>
            </Link>
          </div>
        </nav>
      </aside>
    );
  }

  // =======================
  //   PORTRAIT (barra)
  // =======================
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
        } as ShellVars
      }
      aria-label="Barra de navegación (móvil · portrait)"
    >
      <style jsx global>{`
        .mj-iconmark.is-active .icon-default {
          transform: scale(${ZOOM_SCALE}) !important;
        }
      `}</style>

      {/* Grid 6 cols. Normal: Dashboard, Users, Clients, Apps, Licenses, Ajustes
          Ajustes: (dcha→izda) Volver, Logout, Tema, Aux; col 1-2 invisibles */}
      <div className="relative h-full grid grid-cols-6 place-items-center gap-2">
        {/* Col 1 */}
        {settingsOpen ? (
          <div className="invisible pointer-events-none" aria-hidden="true">
            <IconMark size="md" borderWidth={2} />
          </div>
        ) : (
          <Item href="/" Icon={Gauge} accent={ACCENT["/"]} />
        )}

        {/* Col 2 */}
        {settingsOpen ? (
          <div className="invisible pointer-events-none" aria-hidden="true">
            <IconMark size="md" borderWidth={2} />
          </div>
        ) : (
          <Item href="/users" Icon={Users} accent={ACCENT["/users"]} />
        )}

        {/* Col 3 */}
        {settingsOpen ? (
          <Link
            href="/aux"
            className="group grid place-items-center"
            aria-label="Auxiliares"
          >
            <IconMark
              size="md"
              borderWidth={2}
              interactive
              hoverAnim="zoom"
              style={markStyle(false, ACCENT["/aux"])}
            >
              <LayoutGrid className="h-5 w-5" />
            </IconMark>
          </Link>
        ) : (
          <Item href="/clients" Icon={Building2} accent={ACCENT["/clients"]} />
        )}

        {/* Col 4 */}
        {settingsOpen ? (
          <button
            type="button"
            aria-label="Cambiar tema"
            className="group grid place-items-center"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          >
            <IconMark
              size="md"
              borderWidth={2}
              interactive
              hoverAnim="cycle"
              style={markTheme()}
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
        ) : (
          <Item
            href="/applications"
            Icon={AppWindow}
            accent={ACCENT["/applications"]}
          />
        )}

        {/* Col 5 */}
        {settingsOpen ? (
          <Link
            href="/logout"
            className="group grid place-items-center"
            aria-label="Logout"
          >
            <IconMark
              size="md"
              borderWidth={2}
              interactive
              hoverAnim="zoom"
              style={markLogout()}
            >
              <LogOut className="h-5 w-5" />
            </IconMark>
          </Link>
        ) : (
          <Item
            href="/licenses"
            Icon={BadgeCheck}
            accent={ACCENT["/licenses"]}
          />
        )}

        {/* Col 6: Ajustes / Volver */}
        <button
          type="button"
          aria-label={settingsOpen ? "Volver" : "Ajustes"}
          className="group grid place-items-center"
          onClick={() => setSettingsOpen((v) => !v)}
        >
          <IconMark
            size="md"
            borderWidth={2}
            interactive
            hoverAnim="zoom"
            style={markGear(settingsOpen)}
            className={settingsOpen ? "is-active" : undefined}
          >
            {settingsOpen ? (
              <ArrowLeft className="h-5 w-5" />
            ) : (
              <Settings className="h-5 w-5" />
            )}
          </IconMark>
        </button>
      </div>
    </nav>
  );
}
