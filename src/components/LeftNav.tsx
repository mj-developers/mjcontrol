"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Users,
  Building2,
  AppWindow,
  BadgeCheck,
  LogOut,
  Sun,
  Moon,
  ChevronLeft,
} from "lucide-react";
import { Dispatch, SetStateAction, ReactNode } from "react";

type Theme = "light" | "dark";

type Props = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

export default function LeftNav({ theme, setTheme, open, setOpen }: Props) {
  const pathname = usePathname();
  const isLight = theme === "light";

  const shell = isLight
    ? "bg-white border-zinc-200 text-zinc-900"
    : "bg-zinc-950/80 backdrop-blur border-zinc-800 text-zinc-100";

  // Fila base
  const rowBase =
    "group w-full flex items-center rounded-xl h-12 transition-colors focus:outline-none";

  // Abierto: padding + gap + hover de píldora (AUMENTAMOS EL GAP)
  const rowOpen = `px-4 gap-10 ${
    isLight ? "hover:bg-zinc-100" : "hover:bg-zinc-900/70"
  }`;
  const rowActive = isLight ? "bg-zinc-100" : "bg-zinc-900/80";

  // Cerrado: centrado, sin padding ni gap; hover solo en el círculo
  const rowClosed = "px-0 justify-center";

  const iconClass = "h-7 w-7";

  // Círculo del icono (con opciones para logout)
  const IconCircle = ({
    children,
    forceWhiteBorder = false, // para logout
    disableHover = false, // para logout
  }: {
    children: ReactNode;
    forceWhiteBorder?: boolean;
    disableHover?: boolean;
  }) => (
    <span
      className={[
        "grid place-items-center h-10 w-10 shrink-0 rounded-full border-2 transition",
        forceWhiteBorder
          ? "border-white"
          : isLight
          ? "border-zinc-900"
          : "border-white",
        // En plegado, el hover rellena el círculo (si no lo desactivamos)
        !disableHover && !open
          ? isLight
            ? "group-hover:bg-zinc-100"
            : "group-hover:bg-zinc-900/60"
          : "",
      ].join(" ")}
    >
      <span
        className={
          disableHover ? "" : "transition-transform group-hover:scale-110"
        }
      >
        {children}
      </span>
    </span>
  );

  const Item = ({
    href,
    label,
    icon,
  }: {
    href: string;
    label: string;
    icon: ReactNode;
  }) => {
    const isActive = pathname === href;
    return (
      <Link
        href={href}
        aria-current={isActive ? "page" : undefined}
        className={[
          rowBase,
          open ? rowOpen : rowClosed,
          open && isActive ? rowActive : "",
        ].join(" ")}
      >
        <IconCircle>{icon}</IconCircle>
        {open && <span className="truncate">{label}</span>}
      </Link>
    );
  };

  return (
    <aside
      className={[
        "fixed left-0 top-0 z-40 h-screen border-r",
        shell,
        "transition-[width] duration-300 ease-out",
        "overflow-visible", // el botón no se corta
        open ? "w-64" : "w-20", // un poco más compacto al abrir
      ].join(" ")}
      aria-label="Barra de navegación"
    >
      {/* Header + botón */}
      <div className="relative h-16">
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? "Contraer menú" : "Expandir menú"}
          title={open ? "Contraer" : "Expandir"}
          className={[
            "absolute top-1/2 -translate-y-1/2 right-[-18px] z-50",
            "grid h-10 w-10 place-items-center rounded-full border shadow-sm transition",
            isLight
              ? "bg-white border-zinc-200"
              : "bg-zinc-900 border-zinc-700",
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
      </div>

      <nav className="flex h-[calc(100%-4rem)] flex-col">
        <div className="flex-1 overflow-y-auto p-3 pt-2 space-y-2">
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

          {/* Tema */}
          <button
            onClick={() => setTheme(isLight ? "dark" : "light")}
            className={[rowBase, open ? rowOpen : rowClosed].join(" ")}
            aria-label={
              isLight ? "Cambiar a tema oscuro" : "Cambiar a tema claro"
            }
            title={isLight ? "Cambiar a tema oscuro" : "Cambiar a tema claro"}
            type="button"
          >
            <IconCircle>
              {isLight ? (
                <Sun className={iconClass} />
              ) : (
                <Moon className={iconClass} />
              )}
            </IconCircle>
            {open && <span>Tema</span>}
          </button>
        </div>

        {/* Logout abajo — burdeos SIEMPRE, sin hover de color, aro blanco */}
        <div className="p-3">
          <Link
            href="/logout"
            className={[
              rowBase,
              open ? "px-4 gap-10" : "px-0 justify-center", // gap-6 también aquí
              "bg-[#8E2434] text-white", // sin hover de color
              // foco accesible
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8E2434]/60 focus-visible:ring-offset-2",
              isLight
                ? "focus-visible:ring-offset-white"
                : "focus-visible:ring-offset-zinc-950",
            ].join(" ")}
          >
            <IconCircle forceWhiteBorder disableHover>
              <LogOut className={iconClass} />
            </IconCircle>
            {open && <span>Logout</span>}
          </Link>
        </div>
      </nav>
    </aside>
  );
}
