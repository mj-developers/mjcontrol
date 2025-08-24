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
} from "lucide-react";
import { Dispatch, SetStateAction, ReactNode, CSSProperties } from "react";

type Theme = "light" | "dark";

type Props = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

/** ---- Acentos por sección ---- */
const ACCENT: Record<string, string> = {
  "/": "#6366F1", // Dashboard — indigo-500
  "/users": "#06B6D4", // Usuarios  — cyan-500
  "/clients": "#F59E0B", // Clientes  — amber-500
  "/apps": "#8B5CF6", // Apps      — violet-500
  "/licenses": "#10B981", // Licencias — emerald-500
};

/** Activo si pathname coincide o está dentro de la sección (excepto "/") */
function isRouteActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

/** CSSProperties con variable de acento tipada (sin any) */
type StyleWithAccent = CSSProperties & { ["--item-accent"]?: string };

export default function LeftNav({ theme, setTheme, open, setOpen }: Props) {
  const pathname = usePathname();

  const shell =
    "bg-[var(--shell-bg)] text-[var(--shell-fg)] border-[var(--shell-border)]";

  // Fila base (sin pill gris; más limpio)
  const rowBase =
    "group flex items-center rounded-xl h-12 transition-colors focus:outline-none";
  const rowActive = "bg-transparent";

  // SVG bien centrado
  const iconClass = "h-7 w-7 block leading-none";

  /** Círculo de icono configurable */
  const IconCircle = ({
    children,
    className = "",
    borderColorVar = "--icon-border",
    bgVar,
    textVar,
    hoverFill = true, // controla si el hover pinta el círculo
    zoom = true, // controla si hace el mini-zoom
    forceActive = false,
    style,
  }: {
    children: ReactNode;
    className?: string;
    borderColorVar?: string;
    bgVar?: string; // var (ej. --item-accent)
    textVar?: string; // var (ej. --item-accent)
    hoverFill?: boolean;
    zoom?: boolean;
    forceActive?: boolean;
    style?: CSSProperties;
  }) => (
    <span
      className={[
        "flex items-center justify-center h-10 w-10 rounded-full border-2 transition",
        `border-[var(${borderColorVar})]`,
        // Hover con color de acento (si se desea)
        hoverFill && bgVar ? "group-hover:bg-[var(--item-accent)]" : "",
        hoverFill && bgVar ? "group-hover:border-[var(--item-accent)]" : "",
        hoverFill && textVar ? "group-hover:text-white" : "",
        // Activo = mismo efecto
        forceActive && bgVar
          ? "bg-[var(--item-accent)] border-[var(--item-accent)]"
          : "",
        forceActive && textVar ? "text-white" : "",
        className,
      ].join(" ")}
      style={style}
    >
      <span
        className={zoom ? "transition-transform group-hover:scale-110" : ""}
      >
        {children}
      </span>
    </span>
  );

  /** Etiqueta animada (aparece/desaparece) */
  const Label = ({
    children,
    className = "",
  }: {
    children: ReactNode;
    className?: string;
  }) => (
    <span
      className={[
        "overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin,color,text-decoration-color] duration-300 ease-out",
        open ? "max-w-[12rem] opacity-100 ml-2" : "max-w-0 opacity-0 ml-0",
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );

  /** Item con color de acento por sección (hover + activo) */
  const Item = ({
    href,
    label,
    icon,
  }: {
    href: string;
    label: string;
    icon: ReactNode;
  }) => {
    const active = isRouteActive(pathname, href);
    const accent = ACCENT[href] ?? "#8E2434";
    const rowStyle: StyleWithAccent = { "--item-accent": accent };

    return (
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={[rowBase, active ? rowActive : ""].join(" ")}
        style={rowStyle}
      >
        {/* Rail fijo = 5rem */}
        <div className="w-20 flex-none grid place-items-center">
          <IconCircle
            bgVar="--item-accent"
            textVar="--item-accent"
            forceActive={active}
          >
            {icon}
          </IconCircle>
        </div>

        {/* Texto del mismo color + subrayado en hover/activo */}
        <Label
          className={[
            "decoration-2 underline-offset-4 transition-colors",
            active ? "text-[var(--item-accent)] underline" : "",
            "group-hover:text-[var(--item-accent)] group-hover:underline",
          ].join(" ")}
        >
          {label}
        </Label>
      </Link>
    );
  };

  return (
    <aside
      className={[
        "fixed left-0 top-0 z-40 h-screen border-r",
        shell,
        "transition-[width] duration-300 ease-out",
        "overflow-visible overflow-x-hidden",
        "w-[var(--nav-w)]",
      ].join(" ")}
      aria-label="Barra de navegación"
    >
      {/* Botón toggle fijo en el borde */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Contraer menú" : "Expandir menú"}
        title={open ? "Contraer" : "Expandir"}
        className={[
          "fixed top-8 left-[var(--nav-w)] -translate-x-1/2 z-50",
          "grid h-10 w-10 place-items-center rounded-full border shadow-sm transition",
          "bg-[var(--chip-bg)] border-[var(--chip-border)]",
          "cursor-pointer",
        ].join(" ")}
        type="button"
      >
        <ChevronLeft
          className={[
            "h-5 w-5 transition-transform",
            open ? "rotate-0" : "rotate-180",
          ].join(" ")}
        />
      </button>

      <nav className="flex h-full min-h-0 flex-col">
        {/* BLOQUE CENTRAL → centrado vertical */}
        <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-0 py-2">
          <div className="h-full flex flex-col justify-center gap-2">
            <Item
              href="/"
              label="Dashboard"
              icon={<Gauge className={iconClass} />}
            />
            <Item
              href="/users"
              label="Usuarios"
              icon={<Users className={iconClass} />}
            />
            <Item
              href="/clients"
              label="Clientes"
              icon={<Building2 className={iconClass} />}
            />
            <Item
              href="/apps"
              label="Aplicaciones"
              icon={<AppWindow className={iconClass} />}
            />
            <Item
              href="/licenses"
              label="Licencias"
              icon={<BadgeCheck className={iconClass} />}
            />
          </div>
        </div>

        {/* BLOQUE INFERIOR → Tema + Logout */}
        <div className="px-0 py-3 space-y-2">
          {/* Tema (no usa acento de sección) */}
          <button
            type="button"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label="Cambiar tema"
            title="Cambiar tema"
            className={[rowBase, "w-full text-left cursor-pointer"].join(" ")}
          >
            <div className="w-20 flex-none grid place-items-center">
              <IconCircle>
                <span className="grid place-items-center h-7 w-7">
                  <Sun className={iconClass + " icon-light"} />
                  <Moon className={iconClass + " icon-dark"} />
                </span>
              </IconCircle>
            </div>
            <Label>Tema</Label>
          </button>

          {/* Logout (especial): círculo burdeos siempre, icono negro en claro y blanco en oscuro; con zoom */}
          <Link href="/logout" className={rowBase}>
            <div className="w-20 flex-none grid place-items-center">
              <IconCircle
                borderColorVar="--logout-border"
                bgVar="--logout-circle-bg"
                // No queremos que el hover cambie el fondo, pero sí el zoom:
                hoverFill={false}
                zoom={true}
                style={{
                  borderColor: "var(--logout-border)",
                  background: "var(--logout-circle-bg)",
                  color: theme === "light" ? "#0a0a0a" : "#ffffff", // ⬅️ negro en claro, blanco en oscuro
                }}
              >
                <LogOut className={iconClass} />
              </IconCircle>
            </div>
            <Label className="text-[var(--brand)]">Logout</Label>
          </Link>
        </div>
      </nav>
    </aside>
  );
}
