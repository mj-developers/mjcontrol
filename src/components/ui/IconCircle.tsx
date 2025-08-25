"use client";
import React, {
  ReactNode,
  CSSProperties,
  isValidElement,
  cloneElement,
} from "react";

export type Theme = "light" | "dark";
type Themed<T extends string = string> = T | { light?: T; dark?: T };
export type CircleSize = "xs" | "sm" | "md" | "lg" | "xl" | number;
export type Radius =
  | "none"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "full"
  | number;
export type HoverEffect =
  | "none"
  | "scale"
  | "lift"
  | "tilt"
  | "ring"
  | "glow"
  | "pulse"
  | "spin";

type StyleVars = CSSProperties & {
  ["--accent"]?: string;
  ["--circle-bg"]?: string;
  ["--circle-border"]?: string;
  ["--icon-size"]?: string; // ⬅️ tamaño efectivo del icono
};

export type IconCircleProps = {
  children: ReactNode;
  className?: string;

  theme?: Theme;
  size?: CircleSize;
  iconSize?: number; // si lo pasas, lo forzamos (y lo volvemos par)
  radius?: Radius;
  borderWidth?: number;

  borderColor?: Themed;
  bg?: Themed;
  iconColor?: Themed;
  accent?: Themed;

  active?: boolean;
  fillOnHover?: boolean;
  hoverEffect?: HoverEffect;
  zoomOnHover?: boolean;

  style?: CSSProperties;
  ariaLabel?: string;
};

const sizePx: Record<Exclude<CircleSize, number>, number> = {
  xs: 28,
  sm: 32,
  md: 40,
  lg: 48,
  xl: 56,
};

const radiusClass = (r: Radius) => {
  if (typeof r === "number") return "";
  switch (r) {
    case "none":
      return "rounded-none";
    case "sm":
      return "rounded-sm";
    case "md":
      return "rounded-md";
    case "lg":
      return "rounded-lg";
    case "xl":
      return "rounded-xl";
    case "2xl":
      return "rounded-2xl";
    case "3xl":
      return "rounded-3xl";
    case "full":
    default:
      return "rounded-full";
  }
};

const effectClass: Record<HoverEffect, string> = {
  none: "",
  scale: "hover:scale-110 group-hover:scale-110",
  lift: "hover:-translate-y-0.5 group-hover:-translate-y-0.5",
  tilt: "hover:-rotate-3 group-hover:-rotate-3",
  ring: "hover:ring-2 group-hover:ring-2 hover:ring-[var(--accent)] group-hover:ring-[var(--accent)] hover:ring-offset-2 group-hover:ring-offset-2",
  glow: "hover:shadow-[0_0_18px_var(--accent)] group-hover:shadow-[0_0_18px_var(--accent)]",
  pulse: "hover:animate-pulse",
  spin: "",
};

function pick(value: Themed | undefined, theme?: Theme) {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  return theme && value[theme] ? value[theme] : value.light ?? value.dark;
}

export default function IconCircle({
  children,
  className = "",
  theme,
  size = "md",
  iconSize,
  radius = "full",
  borderWidth = 2,
  borderColor,
  bg,
  iconColor,
  accent = "var(--item-accent)",
  active = false,
  fillOnHover = true,
  hoverEffect = "none",
  zoomOnHover = false,
  style,
  ariaLabel,
}: IconCircleProps) {
  const circlePx = typeof size === "number" ? size : sizePx[size];
  const resolved = {
    border: pick(borderColor, theme),
    bg: pick(bg, theme),
    icon: pick(iconColor, theme),
    accent: pick(accent, theme) ?? "#8E2434",
  };

  // === Tamaño del icono, forzado a PAR para centrar en la cuadrícula de píxeles ===
  const proposed = iconSize ?? Math.max(16, Math.round(circlePx * 0.58)); // ~58% del círculo
  const evenIconPx = proposed % 2 === 0 ? proposed : proposed + 1;

  const base = [
    "inline-flex items-center justify-center border transition leading-none", // ⬅️ leading-none
    radiusClass(radius),
    effectClass[hoverEffect],
    zoomOnHover
      ? "hover:[&>*]:scale-110 group-hover:[&>*]:scale-110 [&>*]:transition-transform"
      : "",
    "bg-[var(--circle-bg)] border-[var(--circle-border)]",
    className,
  ].join(" ");

  const stateClasses = [
    fillOnHover
      ? "hover:bg-[var(--accent)] group-hover:bg-[var(--accent)] hover:border-[var(--accent)] group-hover:border-[var(--accent)]"
      : "",
  ].join(" ");

  const vars: StyleVars = {
    "--accent": resolved.accent,
    "--circle-bg": resolved.bg ?? "transparent",
    "--circle-border": resolved.border ?? "currentColor",
    "--icon-size": `${evenIconPx}px`, // ⬅️ expuesto para wrappers
  };

  const inlineStyle: CSSProperties = {
    width: circlePx,
    height: circlePx,
    borderWidth,
    ...(typeof radius === "number" ? { borderRadius: radius } : {}),
    ...(active
      ? { background: resolved.accent, borderColor: resolved.accent }
      : {}),
    ...style,
  };

  // Si el hijo es un <svg>, inyectamos tamaño par y color (opcional)
  let iconNode = children;
  if (isValidElement(children)) {
    type SvgProps = React.ComponentPropsWithoutRef<"svg">;
    const el = children as React.ReactElement<SvgProps>;
    iconNode = cloneElement<SvgProps>(el, {
      className: el.props.className,
      style: {
        ...(el.props.style || {}),
        width: evenIconPx,
        height: evenIconPx,
        color: resolved.icon,
        display: "block", // ⬅️ evita baseline
      },
    });
  }

  return (
    <span
      role="img"
      aria-label={ariaLabel}
      className={[base, stateClasses].join(" ")}
      style={{ ...(vars as CSSProperties), ...inlineStyle }}
    >
      {iconNode}
    </span>
  );
}
