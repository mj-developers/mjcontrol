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
import IconCircle from "@/components/ui/IconCircle";

export type Theme = "light" | "dark";

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

export default function DesktopNav({ theme, setTheme, open, setOpen }: Props) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // margen fijo del contenido (como lo tenías)
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--content-gap", "2rem");
    document.body.style.paddingLeft = "var(--content-gap)";
    return () => {
      document.body.style.paddingLeft = "";
      root.style.removeProperty("--content-gap");
    };
  }, []);

  const SHELL_BG = theme === "light" ? "#e2e5ea" : "#0d1117";
  const SHELL_BORDER = theme === "light" ? "#0b0b0d" : "#ffffff";
  const SHELL_FG = theme === "light" ? "#0b0b0d" : "#ffffff";

  const shell =
    "bg-[var(--shell-bg)] text-[var(--shell-fg)] border-[var(--shell-border)]";

  const RAIL = "5rem";
  const navVars: StyleWithVars = {
    "--nav-w": open ? "14rem" : RAIL,
    "--label-max": open ? `calc(var(--nav-w) - ${RAIL} - 0.5rem)` : "0px",
    "--shell-bg": SHELL_BG,
    "--shell-border": SHELL_BORDER,
    "--shell-fg": SHELL_FG,
  };

  const rowBase =
    "group flex items-center rounded-xl h-12 transition-colors focus:outline-none";
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

  function iconCls(active: boolean): string {
    const zoom = active ? "" : "transition-transform group-hover:scale-[1.15]";
    if (theme === "light") {
      const base = active ? "text-white" : "text-[#010409]";
      const hover = active ? "" : "group-hover:text-white";
      return ["block", zoom, base, hover].filter(Boolean).join(" ");
    }
    const base = active ? "text-[#0b0b0d]" : "text-white";
    const hover = active ? "" : "group-hover:text-[#0b0b0d]";
    return ["block", zoom, base, hover].filter(Boolean).join(" ");
  }

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
          <IconCircle {...circleBaseProps} accent={accent} active={active}>
            <Icon className={iconCls(active)} />
          </IconCircle>
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
        style={navVars}
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
      {/* Toggle */}
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
        <IconCircle {...circleBaseProps} fillOnHover={false} accent={BRAND}>
          <ChevronLeft
            className={[
              "block",
              "transition-transform group-hover:scale-[1.15]",
              "h-5 w-5",
              open ? "rotate-0" : "rotate-180",
            ].join(" ")}
          />
        </IconCircle>
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
          {/* Tema */}
          <button
            type="button"
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            aria-label="Cambiar tema"
            className="group flex items-center rounded-xl h-12 w-full text-left cursor-pointer"
          >
            <div className="w-20 flex-none grid place-items-center">
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
                  className="relative"
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
            </div>
            <span
              className="overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin,color,text-decoration-color] duration-300 ease-out ml-2"
              style={{ maxWidth: "var(--label-max)" }}
            >
              Tema
            </span>
          </button>

          {/* Logout */}
          <Link
            href="/logout"
            className={rowBase}
            style={{ "--item-accent": BRAND } as StyleWithVars}
          >
            <div className="w-20 flex-none grid place-items-center">
              <IconCircle
                {...circleBaseProps}
                fillOnHover={false}
                bg={BRAND}
                className="group-hover:border-[var(--item-accent)]"
              >
                <LogOut className="block text-white transition-transform group-hover:scale-[1.15]" />
              </IconCircle>
            </div>
            <span
              className="overflow-hidden whitespace-nowrap transition-[max-width,opacity,margin,color,text-decoration-color] duration-300 ease-out ml-2"
              style={{ maxWidth: "var(--label-max)" }}
            >
              <span className="group-hover:text-[var(--item-accent)] group-hover:underline">
                Logout
              </span>
            </span>
          </Link>
        </div>
      </nav>
    </aside>
  );
}
