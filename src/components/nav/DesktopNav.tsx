// src/components/nav/DesktopNav.tsx
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
  "/apps": "#8B5CF6",
  "/licenses": "#10B981",
};
const BRAND = "#8E2434";
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

/** Vars que entiende <IconMark/> */
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
  useEffect(() => setMounted(true), []);

  // Solo publicamos --nav-w (no tocamos márgenes del body)
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--nav-w", open ? "14rem" : "5rem");
    return () => {
      root.style.removeProperty("--nav-w");
    };
  }, [open]);

  // contenedor/rail por tema
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

  const NORMAL_BORDER = theme === "light" ? "#0e1117" : "#ffffff";
  const NORMAL_BG = theme === "light" ? "#e2e5ea" : "#0b0b0d";
  const FG_NORMAL = theme === "light" ? "#010409" : "#ffffff";
  const FG_ACTIVE = theme === "light" ? "#ffffff" : "#0b0b0d";

  /** estilo base (sin acento) -> para Tema y Toggle */
  function markBase(): MarkVars {
    return {
      "--mark-bg": NORMAL_BG,
      "--mark-border": NORMAL_BORDER,
      "--mark-fg": FG_NORMAL,
      "--hover-bg": NORMAL_BG,
      "--hover-border": NORMAL_BORDER,
      "--hover-fg": FG_NORMAL,
    };
  }

  /** estilo para items de menú */
  function markForItem(active: boolean, accent: string): MarkVars {
    return {
      "--mark-bg": active ? accent : NORMAL_BG,
      "--mark-border": active ? accent : NORMAL_BORDER,
      "--mark-fg": active ? FG_ACTIVE : FG_NORMAL,
      "--hover-bg": accent,
      "--hover-border": accent,
      "--hover-fg": FG_ACTIVE,
    };
  }

  /** estilo logout: siempre brand */
  function markLogout(): MarkVars {
    return {
      "--mark-bg": BRAND,
      "--mark-border": BRAND,
      "--mark-fg": "#fff",
      "--hover-bg": BRAND,
      "--hover-border": BRAND,
      "--hover-fg": "#fff",
    };
  }

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
      {children}
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
            <Icon />
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
        style={baseVars}
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
      style={navVars}
      aria-label="Barra de navegación"
    >
      {/* Hover del Link => pinta el IconMark (y excluye los activos) */}
      <style jsx global>{`
        /* color de fondo en hover (cuando pasas por icono o por texto) */
        .mj-navlink:hover .mj-iconmark:not(.is-active) {
          --mark-bg: var(--hover-bg) !important;
          --mark-border: var(--hover-border) !important;
          --mark-fg: var(--hover-fg) !important;
        }
        /* zoom solo del icono cuando haces hover sobre el Link (no el aro) */
        .mj-navlink:hover
          .mj-iconmark:not(.is-active)[data-anim="zoom"]
          .icon-default {
          transform: scale(
            var(--mark-def-scale-hover, ${ZOOM_SCALE})
          ) !important;
        }
        .mj-navlink:hover
          .mj-iconmark:not(.is-active)[data-anim="zoom"]
          .icon-hover {
          transform: scale(var(--mark-hov-scale-hover, 1)) !important;
        }
        /* el ACTIVO siempre zoom del icono y NO cambia en hover */
        .mj-iconmark.is-active .icon-default {
          transform: scale(
            var(--mark-def-scale-hover, ${ZOOM_SCALE})
          ) !important;
        }
      `}</style>

      {/* Toggle plegar/expandir (sin color de fondo; animación zoom OK) */}
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

      <nav className="flex h-full min-h-0 flex-col">
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
              href="/apps"
              label="Aplicaciones"
              Icon={AppWindow}
              accent={ACCENT["/apps"]}
            />
            <NavLink
              href="/licenses"
              label="Licencias"
              Icon={BadgeCheck}
              accent={ACCENT["/licenses"]}
            />
          </div>
        </div>

        <div className="px-0 py-3 space-y-2">
          {/* Tema => animación cycle (no zoom) y sin color de fondo */}
          <button
            type="button"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label="Cambiar tema"
            className="group flex items-center rounded-xl h-12 w-full text-left cursor-pointer"
          >
            <div className="w-20 flex-none grid place-items-center">
              <IconMark
                size="md"
                borderWidth={2}
                interactive
                hoverAnim="cycle"
                style={markBase()}
                icon={theme === "dark" ? <Moon /> : <Sun />}
                hoverIcon={theme === "dark" ? <Sun /> : <Moon />}
              />
            </div>
            <span
              className="overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin,color,text-decoration-color] duration-300 ease-out ml-2"
              style={{ maxWidth: "var(--label-max)" }}
            >
              Tema
            </span>
          </button>

          {/* Logout (siempre brand) */}
          <Link
            href="/logout"
            className={`${rowBase} mj-navlink`}
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
                <LogOut />
              </IconMark>
            </div>
            <span
              className="overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin,color,text-decoration-color] duration-300 ease-out ml-2"
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
