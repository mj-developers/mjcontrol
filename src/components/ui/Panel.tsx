"use client";
import * as React from "react";

type Padding = "none" | "sm" | "md" | "lg";
type Variant = "base" | "soft" | "glass" | "aurora";
type Vignette = "off" | "soft" | "strong";
type Pattern = "none" | "grid" | "diag";

/** Variables CSS que exponemos sin usar `any` */
type PanelCSSVarKeys =
  | "--panel-pattern-gap"
  | "--panel-pattern-thickness"
  | "--panel-pattern-opacity"
  | "--panel-pattern-blend"
  | "--panel-hover-lift";

type PanelStyleVars = React.CSSProperties &
  Partial<Record<PanelCSSVarKeys, string>>;

export type PanelProps = React.HTMLAttributes<HTMLDivElement> & {
  as?: React.ElementType;
  padding?: Padding;
  elevated?: boolean; // sombra (usa --panel-shadow)
  bordered?: boolean; // borde (usa --panel-border)
  header?: React.ReactNode;
  footer?: React.ReactNode;

  /** ===== Apariencia ===== */
  variant?: Variant; // base | soft | glass | aurora
  vignette?: Vignette; // off | soft | strong
  pattern?: Pattern; // none | grid | diag

  /** ===== Opciones patrón (opcionales) ===== */
  patternGap?: number; // px
  patternThickness?: number; // px
  patternOpacity?: number; // 0..1
  patternBlend?: React.CSSProperties["mixBlendMode"]; // p.ej. "overlay"

  /** ===== Hover lift opcional (sin movimiento por defecto) ===== */
  hoverLift?: boolean; // si true, levanta en :hover
  hoverLiftPx?: number; // intensidad del lift (px)
};

const padClass: Record<Padding, string> = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
};

export default function Panel({
  as: asProp,
  className = "",
  padding = "md",
  elevated = true,
  bordered = true,
  header,
  footer,
  children,

  variant = "soft",
  vignette = "off",
  pattern = "none",

  patternGap,
  patternThickness,
  patternOpacity,
  patternBlend,

  hoverLift = false,
  hoverLiftPx = 1,

  ...rest
}: PanelProps) {
  const Tag = (asProp ?? "div") as React.ElementType;

  const base =
    "mj-panel relative overflow-hidden rounded-[var(--panel-radius,12px)] " +
    (elevated
      ? "shadow-[var(--panel-shadow,0_6px_18px_rgba(0,0,0,.25))]"
      : "") +
    (bordered ? " border" : "");

  /** Style vars tipadas, sin `any` */
  const styleVars: PanelStyleVars = {};
  if (patternGap != null) styleVars["--panel-pattern-gap"] = `${patternGap}px`;
  if (patternThickness != null)
    styleVars["--panel-pattern-thickness"] = `${patternThickness}px`;
  if (patternOpacity != null)
    styleVars["--panel-pattern-opacity"] = String(patternOpacity);
  if (patternBlend) styleVars["--panel-pattern-blend"] = patternBlend;
  if (hoverLift) styleVars["--panel-hover-lift"] = `${hoverLiftPx}px`;

  return (
    <Tag
      data-variant={variant}
      data-vignette={vignette}
      data-pattern={pattern}
      data-lift={hoverLift ? "true" : "false"}
      className={[
        base,
        "bg-[var(--panel-bg,#0D1117)]",
        "text-[var(--panel-fg,#fff)]",
        "border-[var(--panel-border,#27272a)]",
        "will-change-transform", // para animaciones suaves si hay lift
        padClass[padding],
        className,
      ].join(" ")}
      style={styleVars}
      {...rest}
    >
      {/* Capa de patrón opcional */}
      {pattern !== "none" && (
        <span
          className="mj-panel-pattern"
          data-kind={pattern}
          aria-hidden="true"
        />
      )}
      {/* Capa aurora opcional (solo si variant=aurora) */}
      {variant === "aurora" && (
        <span className="mj-panel-aurora" aria-hidden="true" />
      )}

      {header && <div className="mb-4 relative z-10">{header}</div>}
      <div className="relative z-10">{children}</div>
      {footer && <div className="mt-4 relative z-10">{footer}</div>}

      <style jsx global>{`
        .mj-panel {
          background-color: var(--panel-bg, #0d1117);
          color: var(--panel-fg, #fff);
          transition: box-shadow 160ms ease, transform 160ms ease,
            background 160ms ease;
        }

        /* ===== Hover lift opcional (por defecto no hay desplazamiento) ===== */
        .mj-panel[data-lift="true"]:hover {
          transform: translateY(calc(var(--panel-hover-lift, 1px) * -1));
          box-shadow: var(
            --panel-shadow-hover,
            0 18px 40px rgba(0, 0, 0, 0.28)
          );
        }

        /* ===== Variant: soft (deluxe sutil, sin mover) ===== */
        .mj-panel[data-variant="soft"]::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background: var(
              --panel-gloss,
              linear-gradient(
                to bottom,
                rgba(255, 255, 255, 0.06),
                rgba(255, 255, 255, 0)
              )
            ),
            var(
              --panel-gradient,
              radial-gradient(
                120% 80% at 50% -20%,
                rgba(255, 255, 255, 0.06),
                transparent 55%
              )
            );
          z-index: 0;
        }

        /* ===== Variant: glass (cristal esmerilado) ===== */
        .mj-panel[data-variant="glass"] {
          background: var(
            --panel-glass-bg,
            linear-gradient(
              180deg,
              rgba(255, 255, 255, 0.08),
              rgba(255, 255, 255, 0.03)
            )
          );
          border-color: var(--panel-glass-border, rgba(255, 255, 255, 0.16));
          backdrop-filter: blur(var(--panel-blur, 10px));
          -webkit-backdrop-filter: blur(var(--panel-blur, 10px));
        }
        .mj-panel[data-variant="glass"]::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          background: linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.08),
            rgba(255, 255, 255, 0)
          );
          z-index: 0;
        }

        /* ===== Variant: aurora (gradientes artísticos animados) ===== */
        .mj-panel[data-variant="aurora"] {
          position: relative;
          overflow: hidden;
        }
        /* Borde degradado (1px) con máscara para no cubrir el interior */
        .mj-panel[data-variant="aurora"]::before {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(
            120deg,
            rgba(99, 102, 241, 0.35),
            rgba(56, 189, 248, 0.35),
            rgba(16, 185, 129, 0.28),
            rgba(139, 92, 246, 0.3)
          );
          -webkit-mask: linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          pointer-events: none;
          z-index: 0;
        }
        .mj-panel[data-variant="aurora"] .mj-panel-aurora {
          position: absolute;
          inset: -40%;
          border-radius: inherit;
          filter: blur(30px);
          opacity: 0.9;
          mix-blend-mode: screen;
          z-index: 0;
          background: radial-gradient(
              40% 32% at 15% 20%,
              rgba(99, 102, 241, 0.18),
              transparent 52%
            ),
            radial-gradient(
              35% 30% at 85% 10%,
              rgba(56, 189, 248, 0.14),
              transparent 55%
            ),
            radial-gradient(
              45% 38% at 40% 100%,
              rgba(16, 185, 129, 0.16),
              transparent 60%
            ),
            radial-gradient(
              28% 24% at 80% 80%,
              rgba(139, 92, 246, 0.18),
              transparent 58%
            );
          animation: panel-aurora 14s ease-in-out infinite alternate;
        }
        @keyframes panel-aurora {
          0% {
            transform: translate(0, 0) rotate(0deg) scale(1);
          }
          50% {
            transform: translate(2%, -1%) rotate(2deg) scale(1.02);
          }
          100% {
            transform: translate(-2%, 1%) rotate(-2deg) scale(1.01);
          }
        }

        /* ===== Vignette (soft/strong) ===== */
        .mj-panel[data-vignette="soft"]::after,
        .mj-panel[data-vignette="strong"]::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          z-index: 0;
          background: radial-gradient(
            140% 110% at 50% 10%,
            transparent 60%,
            var(--_v-col) 100%
          );
        }
        .mj-panel[data-vignette="soft"]::after {
          --_v-col: var(--panel-vignette-color, rgba(0, 0, 0, 0.28));
        }
        .mj-panel[data-vignette="strong"]::after {
          --_v-col: var(--panel-vignette-strong, rgba(0, 0, 0, 0.42));
          background: radial-gradient(
            150% 115% at 50% 8%,
            transparent 45%,
            var(--_v-col) 100%
          );
        }

        /* ===== Pattern (grid/diag) ===== */
        .mj-panel .mj-panel-pattern {
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
          z-index: 0;
          opacity: var(--panel-pattern-opacity, 0.6);
          mix-blend-mode: var(--panel-pattern-blend, normal);
          background-size: auto;
          background-repeat: repeat;
        }
        .mj-panel .mj-panel-pattern[data-kind="grid"] {
          background-image: repeating-linear-gradient(
              0deg,
              var(--panel-pattern-color, rgba(255, 255, 255, 0.06)) 0
                var(--panel-pattern-thickness, 1px),
              transparent var(--panel-pattern-thickness, 1px)
                var(--panel-pattern-gap, 28px)
            ),
            repeating-linear-gradient(
              90deg,
              var(--panel-pattern-color, rgba(255, 255, 255, 0.06)) 0
                var(--panel-pattern-thickness, 1px),
              transparent var(--panel-pattern-thickness, 1px)
                var(--panel-pattern-gap, 28px)
            );
        }
        .mj-panel .mj-panel-pattern[data-kind="diag"] {
          background-image: repeating-linear-gradient(
              45deg,
              var(--panel-pattern-color, rgba(255, 255, 255, 0.06)) 0
                var(--panel-pattern-thickness, 1px),
              transparent var(--panel-pattern-thickness, 1px)
                var(--panel-pattern-gap, 28px)
            ),
            repeating-linear-gradient(
              135deg,
              var(--panel-pattern-color, rgba(255, 255, 255, 0.06)) 0
                var(--panel-pattern-thickness, 1px),
              transparent var(--panel-pattern-thickness, 1px)
                var(--panel-pattern-gap, 28px)
            );
        }
      `}</style>
    </Tag>
  );
}
