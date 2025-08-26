"use client";
import * as React from "react";

type Shape = "circle" | "rounded" | "square" | "pill";
type SizeKey = "xs" | "sm" | "md" | "lg";
type HoverAnim = "none" | "zoom" | "cycle";

/** Variables CSS internas del componente (sin any) */
type IconMarkCSSVars =
  | "--mark-bg"
  | "--mark-border"
  | "--mark-fg"
  | "--mark-zoom-scale"
  | "--mark-def-scale"
  | "--mark-hov-scale"
  | "--mark-def-scale-hover"
  | "--mark-hov-scale-hover"
  | "--mark-def-opacity-hover"
  | "--mark-hov-opacity-hover"
  | "--mark-def-out-x"
  | "--mark-def-out-y"
  | "--mark-hov-in-x"
  | "--mark-hov-in-y"
  | "--mark-def-rot-hover"
  | "--mark-hov-rot-init";

type StyleWithVars = React.CSSProperties &
  Partial<Record<IconMarkCSSVars, string>>;

export type IconMarkProps = {
  icon?: React.ReactNode;
  hoverIcon?: React.ReactNode;
  children?: React.ReactNode;

  size?: SizeKey | number;
  iconSize?: number;
  shape?: Shape;

  /** Override de ancho de borde (px). Si no lo pasas, usa tokens del tema */
  borderWidth?: number;

  interactive?: boolean;
  asButton?: boolean;
  onClick?: React.MouseEventHandler<HTMLButtonElement | HTMLSpanElement>;
  disabled?: boolean;
  buttonType?: "button" | "submit" | "reset";
  title?: string;
  ariaLabel?: string;

  hoverAnim?: HoverAnim;
  zoomScale?: number;

  /** Parámetros del efecto “cycle” */
  cycleOffset?: number; // desplazamiento en px
  cycleAngleDeg?: number; // ángulo del arco (0=→, 90=↑)
  cycleRotateDeg?: number; // rotación del icono saliente
  className?: string;
  style?: React.CSSProperties;
};

function sizeToVar(size: SizeKey | number | undefined) {
  if (typeof size === "number") return `${size}px`;
  switch (size) {
    case "xs":
      return "var(--iconmark-size-xs, 30px)";
    case "sm":
      return "var(--iconmark-size-sm, 36px)";
    case "lg":
      return "var(--iconmark-size-lg, 52px)";
    case "md":
    default:
      return "var(--iconmark-size-md, 44px)";
  }
}
function iconSizeFor(size: SizeKey | number | undefined) {
  if (typeof size === "number") return Math.max(14, Math.round(size * 0.45));
  switch (size) {
    case "xs":
      return 14;
    case "sm":
      return 16;
    case "lg":
      return 24;
    case "md":
    default:
      return 20;
  }
}
function radiusFor(shape: Shape | undefined) {
  switch (shape) {
    case "circle":
    case "pill":
      return "9999px";
    case "square":
      return "6px";
    case "rounded":
    default:
      /* map a var del componente, que a su vez mapea a fondacional */
      return "var(--iconmark-radius, 12px)";
  }
}
function normalizeIcon(node: React.ReactNode, px: number) {
  if (!React.isValidElement(node)) return node;
  type SvgProps = React.ComponentPropsWithoutRef<"svg">;
  const el = node as React.ReactElement<SvgProps>;
  return React.cloneElement<SvgProps>(el, {
    width: px,
    height: px,
    focusable: false,
    "aria-hidden": el.props["aria-label"] ? undefined : true,
    style: { ...(el.props.style || {}), display: "block" },
  });
}

export default function IconMark({
  icon,
  hoverIcon,
  children,
  size = "md",
  iconSize,
  shape = "circle",
  borderWidth,
  interactive = false,
  asButton = false,
  onClick,
  disabled = false,
  buttonType = "button",
  title,
  ariaLabel,
  className = "",
  style,
  hoverAnim = "none",
  zoomScale = 1.06,
  cycleOffset = 10,
  cycleAngleDeg = 35,
  cycleRotateDeg = 14,
}: IconMarkProps) {
  const outer = sizeToVar(size);
  const innerPx = typeof iconSize === "number" ? iconSize : iconSizeFor(size);
  const evenIconPx = innerPx % 2 === 0 ? innerPx : innerPx + 1;
  const radius = radiusFor(shape);

  const base = [
    "mj-iconmark",
    "inline-grid place-items-center align-middle select-none leading-none",
    "transition-[background-color,border-color,box-shadow,transform,color] duration-150",
    interactive
      ? "hover:shadow-[var(--shadow-sm,0_1px_2px_rgba(0,0,0,0.2))]"
      : "",
    asButton
      ? "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand,#8E2434)]/40"
      : "",
    disabled ? "opacity-60 pointer-events-none" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const defaultIcon =
    icon != null
      ? normalizeIcon(icon, evenIconPx)
      : children != null
      ? normalizeIcon(children, evenIconPx)
      : null;

  const hoverIconNode =
    hoverIcon != null ? normalizeIcon(hoverIcon, evenIconPx) : null;

  /* ancho de borde: si no se pasa prop, usa var del componente */
  const bw =
    borderWidth != null
      ? `${borderWidth}px`
      : "var(--iconmark-border-width, 2px)";

  // ==== Variables para animación "cycle"
  // Saliente → DERECHA y ABAJO; Entrante ← IZQUIERDA y ABAJO.
  const rad = (cycleAngleDeg * Math.PI) / 180;
  const dx = Math.cos(rad) * cycleOffset; // +x = derecha
  const dy = Math.sin(rad) * cycleOffset; // +y = abajo
  const right = dx;
  const left = -dx;
  const down = dy;

  const inlineStyle: StyleWithVars = {
    width: outer,
    height: shape === "pill" ? `calc(${outer} * 0.82)` : outer,
    paddingInline: shape === "pill" ? "10px" : undefined,
    borderRadius: radius,
    boxSizing: "border-box",
    borderStyle: "solid",
    borderWidth: bw,
    borderColor: "var(--mark-border, var(--iconmark-border, #ffffff))",
    background: "var(--mark-bg, var(--iconmark-bg, transparent))",
    color: "var(--mark-fg, var(--iconmark-icon-fg, currentColor))",

    /* ZOOM vars */
    ["--mark-zoom-scale"]: String(zoomScale),
    ["--mark-def-scale"]: "1",
    ["--mark-hov-scale"]: "1",
    ["--mark-def-scale-hover"]: hoverIcon ? "0.9" : "var(--mark-zoom-scale)",
    ["--mark-hov-scale-hover"]: hoverIcon ? "var(--mark-zoom-scale)" : "1",
    ["--mark-def-opacity-hover"]: hoverIcon ? "0" : "1",
    ["--mark-hov-opacity-hover"]: hoverIcon ? "1" : "0",

    /* CYCLE vars */
    ["--mark-def-out-x"]: `${right}px`,
    ["--mark-def-out-y"]: `${down}px`,
    ["--mark-hov-in-x"]: `${left}px`,
    ["--mark-hov-in-y"]: `${down}px`,
    ["--mark-def-rot-hover"]: `${cycleRotateDeg}deg`,
    ["--mark-hov-rot-init"]: `${-cycleRotateDeg}deg`,

    ...style,
  };

  const Inner = () => (
    <span
      className="relative inline-grid place-items-center"
      style={{ width: `${evenIconPx}px`, height: `${evenIconPx}px` }}
    >
      <span className="icon-default absolute inset-0 grid place-items-center">
        {defaultIcon}
      </span>
      {hoverIconNode && (
        <span className="icon-hover absolute inset-0 grid place-items-center">
          {hoverIconNode}
        </span>
      )}
    </span>
  );

  const wrapperProps = {
    className: base,
    style: inlineStyle,
    "data-anim": hoverAnim,
    "aria-label": ariaLabel ?? title,
    title,
  } as const;

  return (
    <>
      {asButton ? (
        <button
          type={buttonType}
          onClick={onClick as React.MouseEventHandler<HTMLButtonElement>}
          disabled={disabled}
          {...wrapperProps}
        >
          <Inner />
        </button>
      ) : (
        <span
          role="img"
          onClick={onClick as React.MouseEventHandler<HTMLSpanElement>}
          {...wrapperProps}
        >
          <Inner />
        </span>
      )}

      {/* Mapeos y animaciones (global para poder overridear desde fuera) */}
      <style jsx global>{`
        /* Mapear tokens del tema → vars locales */
        .mj-iconmark {
          --mark-bg: var(--iconmark-bg);
          --mark-border: var(--iconmark-border);
          --mark-fg: var(--iconmark-icon-fg);

          /* Mapear fondacionales → vars del componente (ajustables por-screen) */
          --iconmark-border-width: var(--border-strong, 2px);
          --iconmark-radius: var(--radius-control, 12px);
        }
        .mj-iconmark:hover {
          --mark-bg: var(--iconmark-hover-bg, var(--iconmark-bg));
          --mark-border: var(--iconmark-hover-border, var(--iconmark-border));
          --mark-fg: var(--iconmark-hover-icon-fg, var(--iconmark-icon-fg));
        }

        .mj-iconmark .icon-default,
        .mj-iconmark .icon-hover {
          transition: transform 0.22s cubic-bezier(0.22, 0.61, 0.36, 1),
            opacity 0.22s linear;
        }

        /* none */
        .mj-iconmark[data-anim="none"] .icon-default {
          opacity: 1;
          transform: none;
        }
        .mj-iconmark[data-anim="none"] .icon-hover {
          opacity: 0;
          transform: none;
        }
        .mj-iconmark[data-anim="none"]:hover .icon-default {
          opacity: var(--mark-def-opacity-hover, 1);
        }
        .mj-iconmark[data-anim="none"]:hover .icon-hover {
          opacity: var(--mark-hov-opacity-hover, 0);
        }

        /* zoom */
        .mj-iconmark[data-anim="zoom"] .icon-default {
          opacity: 1;
          transform: scale(var(--mark-def-scale, 1));
        }
        .mj-iconmark[data-anim="zoom"] .icon-hover {
          opacity: 0;
          transform: scale(var(--mark-hov-scale, 1.1));
        }
        .mj-iconmark[data-anim="zoom"]:hover .icon-default {
          opacity: var(--mark-def-opacity-hover, 1);
          transform: scale(var(--mark-def-scale-hover, 1));
        }
        .mj-iconmark[data-anim="zoom"]:hover .icon-hover {
          opacity: var(--mark-hov-opacity-hover, 0);
          transform: scale(var(--mark-hov-scale-hover, 1));
        }

        /* cycle: saliente → derecha/abajo (+rot), entrante ← izquierda/abajo (-rot) */
        .mj-iconmark[data-anim="cycle"] .icon-default {
          opacity: 1;
          transform: translate(0, 0) rotate(0deg) scale(1);
        }
        .mj-iconmark[data-anim="cycle"] .icon-hover {
          opacity: 0;
          transform: translate(
              var(--mark-hov-in-x, -8px),
              var(--mark-hov-in-y, 8px)
            )
            rotate(var(--mark-hov-rot-init, -10deg)) scale(0.92);
        }
        .mj-iconmark[data-anim="cycle"]:hover .icon-default {
          opacity: 0;
          transform: translate(
              var(--mark-def-out-x, 8px),
              var(--mark-def-out-y, 8px)
            )
            rotate(var(--mark-def-rot-hover, 12deg)) scale(0.92);
        }
        .mj-iconmark[data-anim="cycle"]:hover .icon-hover {
          opacity: 1;
          transform: translate(0, 0) rotate(0deg) scale(1);
        }
      `}</style>
    </>
  );
}
