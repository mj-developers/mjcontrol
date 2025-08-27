"use client";
import * as React from "react";

type Variant = "primary" | "outline" | "ghost";
type Size = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;

  /** Overrides de colores (opcionales, pisan tema) */
  bg?: string;
  fg?: string;
  borderColor?: string;
  hoverBg?: string;
  hoverFg?: string;
  hoverBorderColor?: string;

  /** Dimensiones */
  width?: number | string;
  height?: number | string;

  /** Tipografía del LABEL (solo el texto, no íconos) */
  fontFamily?: string; // por defecto: var(--font-heading)
  labelSize?: number | string; // ej 16 | "1rem"
  labelWeight?: number; // ej 700
  labelTracking?: string; // ej "-0.01em"

  /** Efectos de texto */
  textHoverScale?: number; // escala en hover (solo label). Default 1.06

  /** Gloss del fondo (highlight superior + sombra interna inferior) */
  gloss?: boolean; // default true en "primary"

  /** Resplandor exterior */
  glowColor?: string; // default del tema
  glowSize?: number | string; // radio base
  glowSizeHover?: number | string; // radio en hover
  glowOpacity?: number; // 0..1
};

const sizeMap: Record<Size, { h: string; px: string; text: string }> = {
  sm: { h: "var(--btn-h-sm,36px)", px: "12px", text: "text-sm" },
  md: { h: "var(--btn-h-md,48px)", px: "16px", text: "text-sm" },
  lg: { h: "var(--btn-h-lg,56px)", px: "20px", text: "text-base" },
};

type CSSVars = React.CSSProperties & {
  ["--btn-bg"]?: string;
  ["--btn-fg"]?: string;
  ["--btn-border"]?: string;
  ["--btn-hover-bg"]?: string;
  ["--btn-hover-fg"]?: string;
  ["--btn-hover-border"]?: string;

  ["--btn-label-hover-scale"]?: string;

  ["--btn-glow-color"]?: string;
  ["--btn-glow-size"]?: string;
  ["--btn-glow-size-hover"]?: string;
  ["--btn-glow-opacity"]?: string;
};

function toCssSize(v?: number | string): string | undefined {
  if (v == null) return undefined;
  return typeof v === "number" ? `${v}px` : v;
}

export default function Button({
  className = "",
  variant = "primary",
  size = "md",
  fullWidth,
  loading,
  leftIcon,
  rightIcon,
  children,
  disabled,

  bg,
  fg,
  borderColor,
  hoverBg,
  hoverFg,
  hoverBorderColor,

  width,
  height,

  fontFamily,
  labelSize,
  labelWeight,
  labelTracking,
  textHoverScale = 1.06,

  gloss, // default según variante
  glowColor,
  glowSize,
  glowSizeHover,
  glowOpacity,

  ...props
}: ButtonProps) {
  const s = sizeMap[size];
  const isDisabled = disabled || loading;

  const base =
    "mj-btn group relative inline-flex items-center justify-center rounded-[var(--btn-radius,12px)] " +
    "transition-[background-color,color,box-shadow,border-color] duration-200 " +
    "select-none will-change-transform transform-gpu " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand,#8E2434)]/60 " +
    "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--btn-ring-offset,var(--surface-1,#0D1117))]";

  const widthClass = width != null ? "" : fullWidth ? "w-full" : "";

  const styleVars: CSSVars = {
    // fuente por defecto = Sora (via --font-heading)
    fontFamily:
      fontFamily ?? "var(--heading-font, var(--font-heading, ui-sans-serif))",
    height: toCssSize(height) ?? (s.h as React.CSSProperties["height"]),
    width: toCssSize(width),
    paddingInline: s.px,

    // colores overrides (si los pasas)
    ...(bg ? { ["--btn-bg"]: bg } : null),
    ...(fg ? { ["--btn-fg"]: fg } : null),
    ...(borderColor ? { ["--btn-border"]: borderColor } : null),
    ...(hoverBg ? { ["--btn-hover-bg"]: hoverBg } : null),
    ...(hoverFg ? { ["--btn-hover-fg"]: hoverFg } : null),
    ...(hoverBorderColor ? { ["--btn-hover-border"]: hoverBorderColor } : null),

    // hover scale solo del label
    ["--btn-label-hover-scale"]: String(textHoverScale),

    // glow variables
    ...(glowColor ? { ["--btn-glow-color"]: glowColor } : null),
    ...(glowSize ? { ["--btn-glow-size"]: toCssSize(glowSize) } : null),
    ...(glowSizeHover
      ? { ["--btn-glow-size-hover"]: toCssSize(glowSizeHover) }
      : null),
    ...(glowOpacity != null
      ? { ["--btn-glow-opacity"]: String(glowOpacity) }
      : null),
  };

  const isGloss = gloss ?? (variant === "primary" ? true : false); // por defecto, gloss en primary

  return (
    <button
      data-variant={variant}
      data-size={size}
      data-gloss={isGloss ? "true" : "false"}
      aria-busy={loading || undefined}
      disabled={isDisabled}
      className={[
        base,
        "border",
        // base por tokens
        "text-[var(--btn-fg,#fff)]",
        "bg-[var(--btn-bg,var(--brand,#8E2434))]",
        "border-[var(--btn-border,#fff)]",
        "shadow-[var(--btn-shadow,0_12px_24px_rgba(142,36,52,.28))]",
        // hover por tokens (el CONTENEDOR ya no escala)
        "hover:[background:var(--btn-hover-bg,var(--btn-bg))]",
        "hover:text-[var(--btn-hover-fg,var(--btn-fg))]",
        "hover:border-[var(--btn-hover-border,var(--btn-border))]",
        "hover:shadow-[var(--btn-shadow-hover,var(--btn-shadow))]",
        isDisabled ? "opacity-70 pointer-events-none" : "cursor-pointer",
        sizeMap[size].text,
        widthClass,
        className,
      ].join(" ")}
      style={styleVars}
      {...props}
    >
      {/* Glow externo (pseudo-elemento) */}
      {/* Label spinner/iconos */}
      {loading && (
        <span className="absolute left-3 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {leftIcon && <span className="mr-2">{leftIcon}</span>}

      {/* LABEL: controla tipografía y zoom en hover */}
      <span
        className="mj-btn__label transition-transform duration-200 ease-out group-hover:scale-[var(--btn-label-hover-scale,1.06)]"
        style={{
          fontSize: (typeof labelSize === "number"
            ? `${labelSize}px`
            : labelSize) as React.CSSProperties["fontSize"],
          fontWeight: labelWeight as React.CSSProperties["fontWeight"],
          letterSpacing: labelTracking as React.CSSProperties["letterSpacing"],
        }}
      >
        {children}
      </span>

      {rightIcon && <span className="ml-2">{rightIcon}</span>}

      {/* Variantes por data-attr → tokens (overrideables en tema o por props) */}
      <style jsx global>{`
        /* —— Fondo gloss + glow —— */
        .mj-btn::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          box-shadow: 0 0 var(--btn-glow-size, 0px)
            var(--btn-glow-color, transparent);
          opacity: var(--btn-glow-opacity, 1);
          transition: box-shadow 0.2s ease, opacity 0.2s ease;
        }
        .mj-btn:hover::after {
          box-shadow: 0 0 var(--btn-glow-size-hover, var(--btn-glow-size, 0px))
            var(--btn-glow-color, transparent);
        }
        .mj-btn[data-gloss="true"]::before {
          content: "";
          position: absolute;
          inset: 1px; /* respeta el borde blanco */
          border-radius: inherit;
          pointer-events: none;
          /* highlight superior + sombra interna inferior */
          background: linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.16),
              rgba(255, 255, 255, 0.06) 35%,
              rgba(255, 255, 255, 0) 60%
            ),
            radial-gradient(
              120% 80% at 50% -20%,
              rgba(255, 255, 255, 0.18),
              transparent 45%
            );
          box-shadow: inset 0 -18px 36px rgba(0, 0, 0, 0.35);
        }

        /* —— VARIANTES —— */
        .mj-btn[data-variant="primary"] {
          /* Base tema */
          --btn-bg: var(
            --btn-primary-bg,
            linear-gradient(
              to bottom,
              var(--brand-600, #9b2e40),
              var(--brand, #8e2434)
            )
          );
          --btn-fg: var(--btn-primary-fg, #fff);
          --btn-border: var(--btn-primary-border, #fff);
          --btn-shadow: var(
            --btn-primary-shadow,
            0 12px 24px rgba(var(--brand-rgb, 142 36 52), 0.28)
          );

          /* Hover */
          --btn-hover-bg: var(--btn-primary-hover-bg, #ffffff);
          --btn-hover-fg: var(--btn-primary-hover-fg, var(--brand, #8e2434));
          --btn-hover-border: var(--btn-primary-hover-border, #ffffff);
          --btn-shadow-hover: var(
            --btn-primary-shadow-hover,
            0 16px 28px rgba(var(--brand-rgb, 142 36 52), 0.36)
          );

          /* Glow por defecto (tema) */
          --btn-glow-color: var(
            --btn-primary-glow-color,
            rgba(var(--brand-rgb, 142 36 52), 0.28)
          );
          --btn-glow-size: var(--btn-primary-glow-size, 12px);
          --btn-glow-size-hover: var(--btn-primary-glow-size-hover, 20px);
          --btn-glow-opacity: var(--btn-primary-glow-opacity, 1);
        }

        .mj-btn[data-variant="outline"] {
          --btn-bg: var(--btn-outline-bg, transparent);
          --btn-hover-bg: var(
            --btn-outline-hover-bg,
            rgba(255, 255, 255, 0.06)
          );
          --btn-fg: var(--btn-outline-fg, var(--fg, #fff));
          --btn-hover-fg: var(
            --btn-outline-hover-fg,
            var(--btn-outline-fg, #fff)
          );
          --btn-border: var(--btn-outline-border, #fff);
          --btn-hover-border: var(--btn-outline-hover-border, #fff);
          --btn-shadow: var(--btn-outline-shadow, none);
          --btn-shadow-hover: var(--btn-outline-shadow-hover, none);

          --btn-glow-color: var(--btn-outline-glow-color, transparent);
          --btn-glow-size: var(--btn-outline-glow-size, 0px);
          --btn-glow-size-hover: var(--btn-outline-glow-size-hover, 0px);
        }

        .mj-btn[data-variant="ghost"] {
          --btn-bg: var(--btn-ghost-bg, transparent);
          --btn-hover-bg: var(--btn-ghost-hover-bg, rgba(255, 255, 255, 0.06));
          --btn-fg: var(--btn-ghost-fg, var(--fg, #fff));
          --btn-hover-fg: var(--btn-ghost-hover-fg, var(--btn-ghost-fg, #fff));
          --btn-border: var(--btn-ghost-border, #fff);
          --btn-hover-border: var(--btn-ghost-hover-border, #fff);
          --btn-shadow: var(--btn-ghost-shadow, none);
          --btn-shadow-hover: var(--btn-ghost-shadow-hover, none);

          --btn-glow-color: var(--btn-ghost-glow-color, transparent);
          --btn-glow-size: var(--btn-ghost-glow-size, 0px);
          --btn-glow-size-hover: var(--btn-ghost-glow-size-hover, 0px);
        }
      `}</style>
    </button>
  );
}
