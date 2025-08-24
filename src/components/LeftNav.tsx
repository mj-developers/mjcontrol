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

  // Todo depende de variables CSS (definidas por data-theme) → markup estable
  const shell =
    "bg-[var(--shell-bg)] text-[var(--shell-fg)] border-[var(--shell-border)]";

  const rowBase =
    "group w-full flex items-center rounded-xl h-12 transition-colors focus:outline-none";
  const rowOpen = "px-4 gap-10 hover:bg-[var(--hover-pill)]";
  const rowActive = "bg-[var(--row-active)]";
  const rowClosed = "px-0 justify-center";

  const iconClass = "h-7 w-7";

  const IconCircle = ({
    children,
    forceWhiteBorder = false,
    disableHover = false,
  }: {
    children: ReactNode;
    forceWhiteBorder?: boolean;
    disableHover?: boolean;
  }) => (
    <span
      className={[
        "grid place-items-center h-10 w-10 shrink-0 rounded-full border-2 transition",
        forceWhiteBorder ? "border-white" : "border-[var(--icon-border)]",
        !disableHover && !open ? "group-hover:bg-[var(--hover-icon-bg)]" : "",
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
        "overflow-visible",
        open ? "w-64" : "w-20",
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
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className={[
              rowBase,
              open ? rowOpen : rowClosed,
              "cursor-pointer",
            ].join(" ")}
            aria-label="Cambiar tema"
            title="Cambiar tema"
            type="button"
          >
            <IconCircle>
              {/* No condicionamos por JS: CSS decide según data-theme */}
              <span className="relative">
                <Sun className={`${iconClass} icon-light`} />
                <Moon className={`${iconClass} icon-dark`} />
              </span>
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
              open ? "px-4 gap-10" : "px-0 justify-center",
              "bg-[#8E2434] text-white",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8E2434]/60 focus-visible:ring-offset-2",
              // el offset se verá bien en ambos temas porque el fondo del aside lo ponemos con var
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
