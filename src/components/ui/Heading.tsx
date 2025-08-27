"use client";
import * as React from "react";

/** Alineación del texto */
type Align = "left" | "center" | "right";

/** Tipo de relleno del texto */
type Fill = "solid" | "gradient" | "effect"; // "effect" reservado

/** Niveles soportados (h1/h2/h3) */
type Level = 1 | 2 | 3;

/** Sombras predefinidas o personalizada */
type Shadow = "none" | "soft" | "brand" | "soft+brand" | "custom";

/** Props del gradient */
type GradientShape = "linear" | "radial";

export type HeadingProps<T extends React.ElementType = "h1"> = {
  /** Nivel semántico (h1/h2/h3). Si también pasas `as`, este manda para el tag. */
  level?: Level;

  /** Tag a renderizar (por si quieres <div role="heading">, etc.) */
  as?: T;

  /** Contenido del heading */
  children: React.ReactNode;

  /** Estética general */
  fill?: Fill; // solid | gradient | effect
  color?: string; // para fill=solid (por defecto var(--heading-color))
  fontFamily?: string; // por defecto var(--heading-font)
  weight?: number; // 300..900 (por defecto var(--hN-weight))
  tracking?: string; // letter-spacing (por defecto var(--hN-tracking))
  lineHeight?: number | string; // por defecto 1.15

  /** Tamaño: número px o usa tokens por nivel (--h1-size, --h2-size, --h3-size) */
  size?: number | string;

  /** Alineación (por defecto left) */
  align?: Align;

  /** Sombra del texto */
  shadow?: Shadow; // predefinidas
  shadowCustom?: string; // si shadow="custom"

  /** Trazo (contorno) del texto */
  strokeWidth?: number; // px (por defecto var(--heading-stroke-width) ~ 0/1)
  strokeColor?: string; // por defecto var(--heading-stroke-color)
  strokeOpacity?: number; // 0..1 (si tu color ya lleva alpha, puedes omitir)
  /** Futuro: “background del borde” (placeholder) */
  strokeBackground?: string; // (presentado, sin implementación compleja)

  /** Degradado (si fill="gradient") */
  gradientShape?: GradientShape; // linear | radial
  gradientFrom?: string; // por defecto var(--heading-grad-from)
  gradientTo?: string; // por defecto var(--heading-grad-to)
  gradientDirection?: string; // "to right" | "180deg" ... (por defecto var(--heading-grad-angle))
  gradientStops?: [number, number]; // % de cada color, ej [40,60]

  /** Subrayado (toggle sencillo) */
  underline?: boolean;
  underlineOpacity?: number; // 0..1
  underlineWidth?: string; // ej "64%"
  underlineHeight?: number; // px

  /** Overlay perla (leve brillo encima) */
  pearl?: boolean;

  /** Extras */
  className?: string;
  style?: React.CSSProperties;
} & Omit<
  React.ComponentPropsWithoutRef<T>,
  "as" | "children" | "style" | "className"
>;

/* === Defaults por nivel: mapean a tokens del tema === */
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
    // h3
    sizeVar: "var(--h3-size, clamp(1.25rem, 2vw, 1.5rem))",
    weightVar: "var(--h3-weight, 700)",
    trackingVar: "var(--h3-tracking, 0.005em)",
  };
};

/* construye CSS para degradado */
function buildGradientCSS(
  shape: GradientShape,
  from: string,
  to: string,
  direction: string,
  stops?: [number, number]
): React.CSSProperties {
  if (shape === "radial") {
    const stopA = stops ? `${stops[0]}%` : "0%";
    const stopB = stops ? `${stops[1]}%` : "100%";
    return {
      background: `radial-gradient(circle at 50% 50%, ${from} ${stopA}, ${to} ${stopB})`,
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
    };
  }
  // linear
  const stopA = stops ? `${stops[0]}%` : "0%";
  const stopB = stops ? `${stops[1]}%` : "100%";
  return {
    background: `linear-gradient(${direction}, ${from} ${stopA}, ${to} ${stopB})`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
  };
}

/* construye un contorno (stroke) con webkit-text-stroke + fallback via text-shadow */
function buildStrokeShadow(
  width: number,
  color: string,
  opacity?: number
): string {
  const col = opacity != null ? toRgba(color, opacity) : color;
  // 8 direcciones + un par de diagonales extras si el stroke >1
  const offsets = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
    [1, 1],
    [-1, 1],
    [1, -1],
    [-1, -1],
  ];
  const parts: string[] = [];
  const px = Math.max(1, Math.round(width));
  for (let i = 0; i < offsets.length; i++) {
    const [ox, oy] = offsets[i];
    parts.push(`${ox * px}px ${oy * px}px 0 ${col}`);
  }
  // si es grueso, añadimos un anillo más suave
  if (px > 1) {
    const ring = Math.ceil(px / 2);
    parts.push(
      `0 ${ring}px 0 ${col}`,
      `${ring}px 0 0 ${col}`,
      `0 -${ring}px 0 ${col}`,
      `-${ring}px 0 0 ${col}`
    );
  }
  return parts.join(", ");
}

/* convierte un color CSS simple a rgba con opacidad (si ya tiene alpha, lo devuelve tal cual) */
function toRgba(color: string, alpha: number): string {
  // heurística: si ya viene con "rgba(" o tiene "hsla(", lo devolvemos
  const c = color.trim().toLowerCase();
  if (c.startsWith("rgba(") || c.startsWith("hsla(")) return color;
  if (c.startsWith("#")) {
    // #rgb, #rgba, #rrggbb, #rrggbbaa
    if (c.length === 4 || c.length === 5) {
      const r = parseInt(c[1] + c[1], 16);
      const g = parseInt(c[2] + c[2], 16);
      const b = parseInt(c[3] + c[3], 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  // fallback: usa color tal cual con alpha mediante color-mix (soporta navegadores modernos)
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
  // estética
  fill = "solid",
  color, // por defecto tema
  fontFamily,
  weight,
  tracking,
  lineHeight = 1.15,
  // layout
  size,
  align = "left",
  // sombras
  shadow = "soft+brand",
  shadowCustom,
  // stroke
  strokeWidth,
  strokeColor,
  strokeOpacity,
  strokeBackground,
  // gradient
  gradientShape = "linear",
  gradientFrom,
  gradientTo,
  gradientDirection,
  gradientStops,
  // detalles
  underline = false,
  underlineOpacity = 0.7,
  underlineWidth = "64%",
  underlineHeight = 1,
  pearl = false,
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

  // font-size
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
  const fw = weight != null ? weight : d.weightVar;
  const ls = tracking ?? d.trackingVar;

  // sombras predefinidas
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

  // fill styles
  const solidColor = color ?? "var(--heading-color, #fff)";
  const gradFrom =
    gradientFrom ?? "var(--heading-grad-from, var(--brand-600,#9b2e40))";
  const gradTo = gradientTo ?? "var(--heading-grad-to, var(--brand,#8e2434))";
  const gradDir = gradientDirection ?? "var(--heading-grad-angle, 180deg)";

  const fillStyles: React.CSSProperties =
    fill === "gradient"
      ? buildGradientCSS(
          gradientShape,
          gradFrom,
          gradTo,
          gradDir,
          gradientStops
        )
      : fill === "solid"
      ? { color: solidColor }
      : {
          // effect: placeholder
          color: solidColor,
          // aquí podrás montar efectos custom más adelante
        };

  // stroke (contorno)
  const sw =
    strokeWidth ??
    (Number(
      getComputedStyle?.(document.documentElement).getPropertyValue(
        "--heading-stroke-width"
      )
    ) ||
      0);
  const sc = strokeColor ?? "var(--heading-stroke-color, rgba(0,0,0,0.0))";

  // text-shadow final = contour + sombra preset
  const strokeShadow = sw > 0 ? buildStrokeShadow(sw, sc, strokeOpacity) : "";
  const textShadow =
    strokeShadow && shadowPreset !== "none"
      ? `${strokeShadow}, ${shadowPreset}`
      : strokeShadow || shadowPreset;

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
        fontWeight: fw as React.CSSProperties["fontWeight"],
        letterSpacing: ls as React.CSSProperties["letterSpacing"],
        fontSize: fontSize as React.CSSProperties["fontSize"],
        lineHeight,
        textShadow,
        WebkitTextStrokeWidth: sw ? `${sw}px` : undefined,
        WebkitTextStrokeColor:
          strokeOpacity != null ? toRgba(sc, strokeOpacity) : sc,
        ...fillStyles,
        ...style,
      }}
      {...rest}
    >
      {/* “background del borde” – placeholder, sin implementación compleja */}
      {strokeBackground && (
        <span
          aria-hidden
          className="pointer-events-none absolute -inset-1 -z-10 rounded-md"
          style={{ background: strokeBackground }}
        />
      )}

      {children}

      {/* subrayado sencillo */}
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

      {/* overlay “perla” (leve) */}
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
