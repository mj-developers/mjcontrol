"use client";
import * as React from "react";

/** Alineación del texto */
type Align = "left" | "center" | "right";
/** Tipo de relleno del texto */
type Fill = "solid" | "gradient" | "effect";
/** Niveles soportados (h1/h2/h3) */
type Level = 1 | 2 | 3;
/** Sombras predefinidas o personalizada */
type Shadow = "none" | "soft" | "brand" | "soft+brand" | "custom";
/** Props del gradient */
type GradientShape = "linear" | "radial";

export type HeadingProps<T extends React.ElementType = "h1"> = {
  level?: Level;
  as?: T;
  children: React.ReactNode;

  /** Estética general */
  fill?: Fill;
  color?: string; // p.ej. "var(--fg)"
  fontFamily?: string; // por defecto var(--heading-font)
  weight?: number; // 300..900
  tracking?: string; // letter-spacing
  lineHeight?: number | string;

  /** Tamaño: número px o tokens (--h1-size, ...) */
  size?: number | string;

  /** Alineación */
  align?: Align;

  /** Sombras */
  shadow?: Shadow;
  shadowCustom?: string;

  /** Contorno (stroke) */
  strokeWidth?: number; // si no lo pasas, usamos var(--heading-stroke-width)
  strokeColor?: string; // por defecto var(--heading-stroke-color)
  strokeOpacity?: number; // si pasas color con alpha puedes omitir
  strokeBackground?: string;

  /** Degradado (si fill="gradient") */
  gradientShape?: GradientShape;
  gradientFrom?: string; // por defecto var(--heading-grad-from)
  gradientTo?: string; // por defecto var(--heading-grad-to)
  gradientDirection?: string; // por defecto var(--heading-grad-angle)
  gradientStops?: [number, number];

  /** Subrayado */
  underline?: boolean;
  underlineOpacity?: number;
  underlineWidth?: string;
  underlineHeight?: number;

  /** Overlay perla */
  pearl?: boolean;

  className?: string;
  style?: React.CSSProperties;

  /** Nombre del evento de tema (por si lo cambiaste) */
  themeEventName?: string; // default "mj:theme"
} & Omit<
  React.ComponentPropsWithoutRef<T>,
  "as" | "children" | "style" | "className"
>;

const levelToDefaults = (level: Level) => {
  if (level === 1) {
    return {
      sizeVar: "var(--h1-size)",
      weightVar: "var(--h1-weight, 700)",
      trackingVar: "var(--h1-tracking, 0.015em)",
    };
  }
  if (level === 2) {
    return {
      sizeVar: "var(--h2-size, clamp(1.5rem, 2.3vw, 2rem))",
      weightVar: "var(--h2-weight, 700)",
      trackingVar: "var(--h2-tracking, 0.01em)",
    };
  }
  return {
    sizeVar: "var(--h3-size, clamp(1.25rem, 2vw, 1.5rem))",
    weightVar: "var(--h3-weight, 700)",
    trackingVar: "var(--h3-tracking, 0.005em)",
  };
};

/* CSS para el degradado (sin computar colores en JS) */
function gradientCSS(
  shape: GradientShape,
  from: string,
  to: string,
  direction: string,
  stops?: [number, number]
): React.CSSProperties {
  const stopA = stops ? `${stops[0]}%` : "0%";
  const stopB = stops ? `${stops[1]}%` : "100%";
  if (shape === "radial") {
    return {
      background: `radial-gradient(circle at 50% 50%, ${from} ${stopA}, ${to} ${stopB})`,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
    };
  }
  return {
    background: `linear-gradient(${direction}, ${from} ${stopA}, ${to} ${stopB})`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };
}

/* utilidad: mezcla alpha si te pasan strokeOpacity */
function withAlpha(color: string, alpha?: number) {
  if (alpha == null) return color;
  // soporta rgb(), var(), #rrggbb…
  if (color.startsWith("var(")) {
    // browsers modernos aceptan color-mix con var()
    return `color-mix(in srgb, ${color} ${Math.round(
      alpha * 100
    )}%, transparent)`;
  }
  if (color.startsWith("#")) {
    const hex = color.slice(1);
    const r = parseInt(
      hex.length === 3 ? hex[0] + hex[0] : hex.slice(0, 2),
      16
    );
    const g = parseInt(
      hex.length === 3 ? hex[1] + hex[1] : hex.slice(2, 4),
      16
    );
    const b = parseInt(
      hex.length === 3 ? hex[2] + hex[2] : hex.slice(4, 6),
      16
    );
    return `rgba(${r},${g},${b},${alpha})`;
  }
  if (color.startsWith("rgb(")) {
    const nums = color
      .slice(4, -1)
      .split(",")
      .map((s) => parseInt(s.trim(), 10));
    return `rgba(${nums[0]},${nums[1]},${nums[2]},${alpha})`;
  }
  return `color-mix(in srgb, ${color} ${Math.round(
    alpha * 100
  )}%, transparent)`;
}

export default function Heading<T extends React.ElementType = "h1">({
  level = 1,
  as,
  children,
  className = "",
  style,
  fill = "solid",
  color, // por defecto tema
  fontFamily,
  weight,
  tracking,
  lineHeight = 1.15,
  size,
  align = "left",
  shadow = "soft+brand",
  shadowCustom,
  strokeWidth, // si no lo pasas, usamos var(--heading-stroke-width)
  strokeColor,
  strokeOpacity,
  strokeBackground,
  gradientShape = "linear",
  gradientFrom,
  gradientTo,
  gradientDirection,
  gradientStops,
  underline = false,
  underlineOpacity = 0.7,
  underlineWidth = "64%",
  underlineHeight = 1,
  pearl = false,
  themeEventName = "mj:theme",
  ...rest
}: HeadingProps<T>) {
  // decide tag
  const fallbackTag: Record<Level, "h1" | "h2" | "h3"> = {
    1: "h1",
    2: "h2",
    3: "h3",
  };
  const Tag = (as ?? fallbackTag[level]) as React.ElementType;

  // defaults por nivel
  const d = levelToDefaults(level);

  // tamaño
  const fontSize =
    typeof size === "number" ||
    (typeof size === "string" && size.trim().endsWith("px"))
      ? typeof size === "number"
        ? `${size}px`
        : size
      : size ?? d.sizeVar;

  // tipografía
  const ff =
    fontFamily ?? "var(--heading-font, var(--font-display, ui-sans-serif))";
  const fw = (
    weight != null ? weight : d.weightVar
  ) as React.CSSProperties["fontWeight"];
  const ls = (tracking ??
    d.trackingVar) as React.CSSProperties["letterSpacing"];

  // sombras predefinidas (no dependen del tema en JS; usan vars cuando toca)
  const shadowPreset =
    shadow === "none"
      ? "none"
      : shadow === "soft"
      ? "0 6px 18px rgba(0,0,0,0.35)"
      : shadow === "brand"
      ? "0 4px 14px rgba(var(--brand-rgb,142 36 52),0.18)"
      : shadow === "soft+brand"
      ? "0 6px 18px rgba(0,0,0,0.35), 0 4px 14px rgba(var(--brand-rgb,142 36 52),0.18)"
      : shadowCustom ?? "none";

  // relleno
  const solidColor = color ?? "var(--heading-color, #fff)";
  const gradFrom =
    gradientFrom ?? "var(--heading-grad-from, var(--brand-600,#9b2e40))";
  const gradTo = gradientTo ?? "var(--heading-grad-to, var(--brand,#8e2434))";
  const gradDir = gradientDirection ?? "var(--heading-grad-angle, 180deg)";
  const fillStyles: React.CSSProperties =
    fill === "gradient"
      ? gradientCSS(gradientShape, gradFrom, gradTo, gradDir, gradientStops)
      : fill === "solid"
      ? { color: solidColor }
      : { color: solidColor }; // placeholder para "effect"

  // stroke: si no pasas strokeWidth, delega en CSS var (reactiva al tema)
  const strokeW =
    strokeWidth != null
      ? `${Math.max(0, Math.round(strokeWidth))}px`
      : "var(--heading-stroke-width, 0px)";
  const strokeCol = withAlpha(
    strokeColor ?? "var(--heading-stroke-color, rgba(0,0,0,0))",
    strokeOpacity
  );

  // alineación
  const alignClass =
    align === "left"
      ? "text-left"
      : align === "right"
      ? "text-right"
      : "text-center";

  return (
    <Tag
      className={["relative leading-[1.15]", alignClass, className].join(" ")}
      style={{
        fontFamily: ff,
        fontWeight: fw,
        letterSpacing: ls,
        fontSize,
        lineHeight,
        textShadow: shadowPreset,
        WebkitTextStrokeWidth: strokeW,
        WebkitTextStrokeColor: strokeCol,
        ...fillStyles,
        ...style,
      }}
      {...rest}
    >
      {strokeBackground && (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1 -z-10 rounded-md"
          style={{ background: strokeBackground }}
        />
      )}

      {children}

      {underline && (
        <span
          aria-hidden
          className="pointer-events-none absolute block"
          style={{
            left: align === "left" ? "0" : align === "right" ? "auto" : "50%",
            right: align === "right" ? "0" : "auto",
            transform: align === "center" ? "translateX(-50%)" : undefined,
            bottom: "-0.55em",
            width: underlineWidth,
            height: underlineHeight,
            borderRadius: 999,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.85), transparent)",
            opacity: underlineOpacity,
            filter: "blur(0.2px)",
          }}
        />
      )}

      {pearl && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-md mix-blend-screen"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.08), transparent 40%), radial-gradient(120% 60% at 50% -10%, rgba(255,255,255,0.05), transparent 45%)",
          }}
        />
      )}
    </Tag>
  );
}
