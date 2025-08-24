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

  const shell =
    "bg-[var(--shell-bg)] text-[var(--shell-fg)] border-[var(--shell-border)]";

  const rowBase =
    "group flex items-center rounded-xl h-12 transition-colors focus:outline-none hover:bg-[var(--hover-pill)]";
  const rowActive = "bg-[var(--row-active)]";

  // 👇 aseguramos centrado perfecto dentro del círculo
  const iconClass = "h-7 w-7 block leading-none";

  const IconCircle = ({
    children,
    className = "",
    borderColorVar = "--icon-border",
    bgVar,
    textVar,
    disableHover = false,
    style,
  }: {
    children: ReactNode;
    className?: string;
    borderColorVar?: string;
    bgVar?: string;
    textVar?: string;
    disableHover?: boolean;
    style?: React.CSSProperties;
  }) => (
    <span
      className={[
        "flex items-center justify-center h-10 w-10 rounded-full border-2 transition",
        `border-[var(${borderColorVar})]`,
        bgVar ? `bg-[var(${bgVar})]` : "",
        textVar ? `text-[var(${textVar})]` : "",
        !disableHover ? "group-hover:bg-[var(--hover-icon-bg)]" : "",
        className,
      ].join(" ")}
      style={style}
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

  const Label = ({
    children,
    className = "",
  }: {
    children: ReactNode;
    className?: string;
  }) => (
    <span
      className={[
        "overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin] duration-300 ease-out",
        open ? "max-w-[12rem] opacity-100 ml-2" : "max-w-0 opacity-0 ml-0",
        className,
      ].join(" ")}
    >
      {children}
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
        className={[rowBase, isActive ? rowActive : ""].join(" ")}
      >
        {/* Rail fijo = 5rem (centrado en colapsado) */}
        <div className="w-20 flex-none grid place-items-center">
          <IconCircle>{icon}</IconCircle>
        </div>
        <Label>{label}</Label>
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
      {/* Botón toggle fijo en el borde (no se corta) */}
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

      <nav className="flex h-full flex-col">
        {/* BLOQUE CENTRAL → centramos verticalmente la lista */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden px-0 py-2">
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
          {/* Tema */}
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

          {/* Logout */}
          <Link href="/logout" className={rowBase}>
            <div className="w-20 flex-none grid place-items-center">
              <IconCircle
                borderColorVar="--logout-border"
                bgVar="--logout-circle-bg"
                textVar="--logout-icon"
                disableHover
                // Forzamos por style por si hay reglas más específicas
                style={{
                  borderColor: "var(--logout-border)",
                  background: "var(--logout-circle-bg)",
                  color: "var(--logout-icon)",
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
