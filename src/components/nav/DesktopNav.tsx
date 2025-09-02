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
  ChevronLeft,
  Settings,
  ArrowLeft,
  Table2,
  type LucideIcon,
} from "lucide-react";
import {
  Dispatch,
  SetStateAction,
  CSSProperties,
  useEffect,
  ReactNode,
  useState,
} from "react";
import IconMark from "@/components/ui/IconMark";
import type { Theme } from "@/lib/theme";

type Props = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

const ACCENT: Record<string, string> = {
  "/": "#6366F1",
  "/users": "#06B6D4",
  "/clients": "#F59E0B",
  "/applications": "#8B5CF6",
  "/licenses": "#10B981",
};
const BRAND = "#8E2434";
const BROWN = "#8B5E3C"; // Auxiliares
const ZOOM_SCALE = 1.5;

function isRouteActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

type StyleWithVars = CSSProperties & {
  ["--nav-w"]?: string;
  ["--label-max"]?: string;
  ["--item-accent"]?: string;
  ["--shell-bg"]?: string;
  ["--shell-fg"]?: string;
  ["--shell-border"]?: string;
};

type MarkVars = CSSProperties & {
  ["--mark-bg"]?: string;
  ["--mark-border"]?: string;
  ["--mark-fg"]?: string;
  ["--hover-bg"]?: string;
  ["--hover-border"]?: string;
  ["--hover-fg"]?: string;
};

export default function DesktopNav({ theme, setTheme, open, setOpen }: Props) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  useEffect(() => setMounted(true), []);

  // publicar --nav-w
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--nav-w", open ? "14rem" : "5rem");
    return () => {
      root.style.removeProperty("--nav-w");
    };
  }, [open]);

  // shell
  const SHELL_BG = theme === "light" ? "#e2e5ea" : "#0d1117";
  const SHELL_BORDER = theme === "light" ? "#0b0b0d" : "#ffffff";
  const SHELL_FG = theme === "light" ? "#0b0b0d" : "#ffffff";
  const shell =
    "bg-[var(--shell-bg)] text-[var(--shell-fg)] border-[var(--shell-border)]";

  const RAIL = "5rem";
  const baseVars: StyleWithVars = {
    "--nav-w": open ? "14rem" : RAIL,
    "--label-max": open ? `calc(var(--nav-w) - ${RAIL} - 0.5rem)` : "0px",
  };
  const themeVars: Partial<StyleWithVars> = mounted
    ? {
        ["--shell-bg"]: SHELL_BG,
        ["--shell-border"]: SHELL_BORDER,
        ["--shell-fg"]: SHELL_FG,
      }
    : {};
  const navVars: StyleWithVars = { ...baseVars, ...themeVars };

  // paletas por tema
  const LIGHT = {
    BORDER: "#0b0b0d",
    BG: "#e2e5ea",
    FG: "#010409",
    FG_ACTIVE: "#ffffff",
  };
  const DARK = {
    BORDER: "#ffffff",
    BG: "#0b0b0d",
    FG: "#ffffff",
    FG_ACTIVE: "#0b0b0d",
  };
  const P = theme === "light" ? LIGHT : DARK;
  const OPP = theme === "light" ? DARK : LIGHT;

  // Gris de engranaje igual que mobile
  const GEAR_BG = theme === "light" ? "#8893A2" : "#565D66";
  const GEAR_HOV = theme === "light" ? "#7C8898" : "#626A74";

  /** Estilo base icono simple */
  function markBase(): MarkVars {
    return {
      "--mark-bg": P.BG,
      "--mark-border": P.BORDER,
      "--mark-fg": P.FG,
      "--hover-bg": P.BG,
      "--hover-border": P.BORDER,
      "--hover-fg": P.FG,
    };
  }
  /** Tema: hover = paleta opuesta (para la animación cycle) */
  function markTheme(): MarkVars {
    return {
      "--mark-bg": P.BG,
      "--mark-border": P.BORDER,
      "--mark-fg": P.FG,
      "--hover-bg": OPP.BG,
      "--hover-border": OPP.BORDER,
      "--hover-fg": OPP.FG,
    };
  }
  /** Ajustes/Volver: gris como mobile */
  function markSettings(active: boolean): MarkVars {
    return {
      "--mark-bg": active ? GEAR_BG : P.BG,
      "--mark-border": active ? GEAR_BG : P.BORDER,
      "--mark-fg": P.FG,
      "--hover-bg": GEAR_HOV,
      "--hover-border": GEAR_HOV,
      "--hover-fg": P.FG,
    };
  }
  /** Item con acento propio */
  function markForItem(active: boolean, accent: string): MarkVars {
    return {
      "--mark-bg": active ? accent : P.BG,
      "--mark-border": active ? accent : P.BORDER,
      "--mark-fg": active ? P.FG_ACTIVE : P.FG,
      "--hover-bg": accent,
      "--hover-border": accent,
      "--hover-fg": P.FG_ACTIVE,
    };
  }
  /** Logout brand */
  function markLogout(): MarkVars {
    return {
      "--mark-bg": BRAND,
      "--mark-border": BRAND,
      "--mark-fg": "#ffffff",
      "--hover-bg": BRAND,
      "--hover-border": BRAND,
      "--hover-fg": "#ffffff",
    };
  }

  const rowBase =
    "group mj-navlink flex items-center rounded-xl h-12 transition-colors focus:outline-none";
  const IconRail = ({ children }: { children: ReactNode }) => (
    <div className="w-20 flex-none grid place-items-center">{children}</div>
  );
  const Label = ({ children }: { children: ReactNode }) => (
    <span
      className={[
        "overflow-hidden whitespace-nowrap",
        "transition-[max-width,opacity,margin,color,text-decoration-color] duration-300 ease-out",
        open ? "opacity-100 ml-2" : "opacity-0 ml-0",
        "decoration-2 underline-offset-4",
      ].join(" ")}
      style={{ maxWidth: "var(--label-max)" }}
    >
      {children}
    </span>
  );

  const NavMark = ({
    active,
    accent,
    children,
  }: {
    active: boolean;
    accent: string;
    children: React.ReactNode;
  }) => (
    <IconMark
      size="md"
      borderWidth={2}
      interactive
      hoverAnim="zoom"
      zoomScale={ZOOM_SCALE}
      className={active ? "is-active" : undefined}
      style={markForItem(active, accent)}
    >
      <div className="h-5 w-5 grid place-items-center">{children}</div>
    </IconMark>
  );

  const NavLink = ({
    href,
    label,
    Icon,
    accent,
  }: {
    href: string;
    label: string;
    Icon: LucideIcon;
    accent: string;
  }) => {
    const active = isRouteActive(pathname, href);
    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={rowBase}
        style={{ "--item-accent": accent } as StyleWithVars}
      >
        <IconRail>
          <NavMark active={active} accent={accent}>
            <Icon className="h-5 w-5" />
          </NavMark>
        </IconRail>
        <Label>
          <span
            className={[
              active ? "text-[var(--item-accent)] underline" : "",
              "group-hover:text-[var(--item-accent)] group-hover:underline",
            ].join(" ")}
          >
            {label}
          </span>
        </Label>
      </Link>
    );
  };

  if (!mounted) {
    return (
      <aside
        className={[
          "fixed left-0 top-0 z-40 h-screen border-r",
          shell,
          "transition-[width] duration-300 ease-out",
          "overflow-visible overflow-x-hidden",
          "w-[var(--nav-w)]",
        ].join(" ")}
        style={{
          ...baseVars,
          fontFamily: "var(--font-heading, Sora, ui-sans-serif)",
        }}
        aria-label="Barra de navegación"
      >
        <nav className="flex h-full flex-col" />
      </aside>
    );
  }

  return (
    <aside
      className={[
        "fixed left-0 top-0 z-40 h-screen border-r",
        shell,
        "transition-[width] duration-300 ease-out",
        "overflow-visible overflow-x-hidden",
        "w-[var(--nav-w)]",
      ].join(" ")}
      style={{
        ...navVars,
        fontFamily: "var(--font-heading, Sora, ui-sans-serif)",
      }}
      aria-label="Barra de navegación"
    >
      {/* Hovers globales */}
      <style jsx global>{`
        /* Hover del link colorea IconMark (excluye activo) */
        .mj-navlink:hover .mj-iconmark:not(.is-active) {
          --mark-bg: var(--hover-bg) !important;
          --mark-border: var(--hover-border) !important;
          --mark-fg: var(--hover-fg) !important;
        }
        /* Zoom en iconos con anim=zoom */
        .mj-navlink:hover
          .mj-iconmark:not(.is-active)[data-anim="zoom"]
          .icon-default {
          transform: scale(
            var(--mark-def-scale-hover, ${ZOOM_SCALE})
          ) !important;
        }
        .mj-iconmark.is-active .icon-default {
          transform: scale(
            var(--mark-def-scale-hover, ${ZOOM_SCALE})
          ) !important;
        }

        /* Hover en filas del panel (y también Ajustes/Volver) */
        .mj-settings-row:hover .mj-iconmark {
          --mark-bg: var(--hover-bg) !important;
          --mark-border: var(--hover-border) !important;
          --mark-fg: var(--hover-fg) !important;
        }
        /* Zoom cuando la fila (no sólo el icono) está en hover */
        .mj-settings-row:hover .mj-iconmark[data-anim="zoom"] .icon-default {
          transform: scale(${ZOOM_SCALE}) !important;
        }
        /* Cycle completo al hacer hover en la fila: incluir opacidades */
        .mj-settings-row:hover .mj-iconmark[data-anim="cycle"] .icon-hover {
          transform: scale(1) !important;
          opacity: 1 !important;
        }
        .mj-settings-row:hover .mj-iconmark[data-anim="cycle"] .icon-default {
          transform: scale(0) !important;
          opacity: 0 !important;
        }
      `}</style>

      {/* Botón expand/contraer del rail */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Contraer menú" : "Expandir menú"}
        title={open ? "Contraer" : "Expandir"}
        className={[
          "fixed top-8 left-[var(--nav-w)] -translate-x-1/2 z-50",
          "grid place-items-center cursor-pointer group",
          "transition-[left] duration-300 ease-out",
        ].join(" ")}
        type="button"
      >
        <IconMark
          size="md"
          borderWidth={2}
          interactive
          hoverAnim="zoom"
          zoomScale={ZOOM_SCALE}
          style={markBase()}
        >
          <ChevronLeft
            className={[
              "block transition-transform group-hover:scale-[1.15]",
              "h-5 w-5",
              open ? "rotate-0" : "rotate-180",
            ].join(" ")}
          />
        </IconMark>
      </button>

      {/* nav relativo para layout */}
      <nav className="relative flex h-full min-h-0 flex-col">
        {/* Lista principal */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-0 py-2">
          <div className="h-full flex flex-col justify-center gap-2">
            <NavLink
              href="/"
              label="Dashboard"
              Icon={Gauge}
              accent={ACCENT["/"]}
            />
            <NavLink
              href="/users"
              label="Usuarios"
              Icon={Users}
              accent={ACCENT["/users"]}
            />
            <NavLink
              href="/clients"
              label="Clientes"
              Icon={Building2}
              accent={ACCENT["/clients"]}
            />
            <NavLink
              href="/applications"
              label="Aplicaciones"
              Icon={AppWindow}
              accent={ACCENT["/applications"]}
            />
            <NavLink
              href="/licenses"
              label="Licencias"
              Icon={BadgeCheck}
              accent={ACCENT["/licenses"]}
            />
          </div>
        </div>

        {/* Fila inferior fija (Auxiliares y Tema SIEMPRE montados) */}
        <div className="px-0 py-3 space-y-3 relative">
          {/* Auxiliares (ocupa espacio siempre; invisible si está cerrado) */}
          <Link
            href="/aux"
            className={[
              "mj-settings-row group flex items-center rounded-xl h-12",
              settingsOpen ? "" : "invisible pointer-events-none",
            ].join(" ")}
            style={{ "--item-accent": BROWN } as StyleWithVars}
          >
            <IconRail>
              <IconMark
                size="md"
                borderWidth={2}
                interactive
                hoverAnim="zoom"
                zoomScale={ZOOM_SCALE}
                style={markForItem(false, BROWN)}
              >
                <Table2 className="h-5 w-5" />
              </IconMark>
            </IconRail>
            <Label>
              <span className="group-hover:text-[var(--item-accent)] group-hover:underline">
                Auxiliares
              </span>
            </Label>
          </Link>

          {/* Tema (ocupa espacio siempre; invisible si está cerrado) */}
          <button
            type="button"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label="Cambiar tema"
            className={[
              "mj-settings-row group flex items-center rounded-xl h-12 w-full text-left cursor-pointer",
              settingsOpen ? "" : "invisible pointer-events-none",
            ].join(" ")}
            style={{ "--item-accent": "#00000000" } as StyleWithVars}
          >
            <IconRail>
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
            </IconRail>
            <Label>
              <span className="group-hover:underline">Tema</span>
            </Label>
          </button>

          {/* Ajustes / Volver (activo mientras settingsOpen=true) */}
          <button
            type="button"
            onClick={() => setSettingsOpen((s) => !s)}
            aria-label={settingsOpen ? "Volver" : "Ajustes"}
            className="mj-settings-row group flex items-center rounded-xl h-12 w-full text-left cursor-pointer"
            style={{ "--item-accent": GEAR_HOV } as StyleWithVars}
          >
            <div className="w-20 flex-none grid place-items-center">
              <IconMark
                size="md"
                borderWidth={2}
                interactive
                hoverAnim="zoom"
                zoomScale={ZOOM_SCALE}
                style={markSettings(settingsOpen)}
                className={settingsOpen ? "is-active" : undefined}
              >
                {settingsOpen ? (
                  <ArrowLeft className="h-5 w-5" />
                ) : (
                  <Settings className="h-5 w-5" />
                )}
              </IconMark>
            </div>
            <span
              className={[
                "overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin,color,text-decoration-color] duration-300 ease-out ml-2",
                settingsOpen
                  ? "text-[var(--item-accent)] underline"
                  : "group-hover:text-[var(--item-accent)] group-hover:underline",
              ].join(" ")}
              style={{ maxWidth: "var(--label-max)" }}
            >
              {settingsOpen ? "Volver" : "Ajustes"}
            </span>
          </button>

          {/* Logout */}
          <Link
            href="/logout"
            className="group flex items-center rounded-xl h-12"
            style={{ "--item-accent": BRAND } as StyleWithVars}
          >
            <div className="w-20 flex-none grid place-items-center">
              <IconMark
                size="md"
                borderWidth={2}
                interactive
                hoverAnim="zoom"
                zoomScale={ZOOM_SCALE}
                style={markLogout()}
              >
                <LogOut className="h-5 w-5" />
              </IconMark>
            </div>
            <span
              className="overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin,color,text-decoration-color] duration-300 ease-out ml-2 group-hover:text-[var(--item-accent)] group-hover:underline"
              style={{ maxWidth: "var(--label-max)" }}
            >
              Logout
            </span>
          </Link>
        </div>
      </nav>
    </aside>
  );
}
