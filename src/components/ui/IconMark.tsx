"use client";
import * as React from "react";

type Shape = "circle" | "rounded" | "square" | "pill";
type SizeKey = "xs" | "sm" | "md" | "lg" | "xl" | "xxl" | "hero" | "xxxl";
type HoverAnim = "none" | "zoom" | "cycle";

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

  cycleOffset?: number;
  cycleAngleDeg?: number;
  cycleRotateDeg?: number;

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
    case "md":
      return "var(--iconmark-size-md, 44px)";
    case "lg":
      return "var(--iconmark-size-lg, 52px)";
    case "xl":
      return "var(--iconmark-size-xl, 72px)";
    case "xxl":
      return "var(--iconmark-size-xxl, 420px)";
    case "hero":
      return "var(--iconmark-size-hero, 360px)";
    case "xxxl":
      return "var(--iconmark-size-xxxl, 500px)";
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
    case "md":
      return 20;
    case "lg":
      return 24;
    case "xl":
      return 32;
    case "xxl":
      return 210;
    case "hero":
      return 288; // 0.8 de 360 (igual proporción que 400/500)
    case "xxxl":
      return 400;
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
      return "var(--iconmark-radius, 12px)";
  }
}

/** Normaliza <svg> y <img> para llenar el slot sin baseline/gaps */
function normalizeIcon(node: React.ReactNode, px: number): React.ReactNode {
  if (!React.isValidElement(node)) return node;

  if (typeof node.type === "string") {
    const tag = node.type;

    if (tag === "svg") {
      const el = node as React.ReactElement<
        React.SVGProps<SVGSVGElement>,
        "svg"
      >;
      return React.cloneElement<React.SVGProps<SVGSVGElement>>(el, {
        width: px,
        height: px,
        focusable: false,
        "aria-hidden": el.props["aria-label"] ? undefined : true,
        style: { ...(el.props.style ?? {}), display: "block" },
      });
    }

    if (tag === "img") {
      const img = node as React.ReactElement<
        React.ImgHTMLAttributes<HTMLImageElement>,
        "img"
      >;
      return React.cloneElement<React.ImgHTMLAttributes<HTMLImageElement>>(
        img,
        {
          draggable: false,
          style: {
            ...(img.props.style ?? {}),
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: "contain",
          },
        }
      );
    }
  }

  return node;
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

  const bw =
    borderWidth != null
      ? `${borderWidth}px`
      : "var(--iconmark-border-width, var(--border-strong, 2px))";

  const rad = (cycleAngleDeg * Math.PI) / 180;
  const dx = Math.cos(rad) * cycleOffset;
  const dy = Math.sin(rad) * cycleOffset;

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

    ["--mark-zoom-scale"]: String(zoomScale),
    ["--mark-def-scale"]: "1",
    ["--mark-hov-scale"]: "1",
    ["--mark-def-scale-hover"]: hoverIcon ? "0.9" : "var(--mark-zoom-scale)",
    ["--mark-hov-scale-hover"]: hoverIcon ? "var(--mark-zoom-scale)" : "1",
    ["--mark-def-opacity-hover"]: hoverIcon ? "0" : "1",
    ["--mark-hov-opacity-hover"]: hoverIcon ? "1" : "0",

    ["--mark-def-out-x"]: `${dx}px`,
    ["--mark-def-out-y"]: `${dy}px`,
    ["--mark-hov-in-x"]: `${-dx}px`,
    ["--mark-hov-in-y"]: `${dy}px`,
    ["--mark-def-rot-hover"]: `${cycleRotateDeg}deg`,
    ["--mark-hov-rot-init"]: `${-cycleRotateDeg}deg`,

    ...style,
  };

  // ===== Autocentrado robusto =====
  const outerNodeRef = React.useRef<HTMLElement | null>(null);
  const setOuterNode = React.useCallback(
    (el: HTMLSpanElement | HTMLButtonElement | null) => {
      outerNodeRef.current = el ?? null;
    },
    []
  );
  const defaultSlotRef = React.useRef<HTMLSpanElement | null>(null);

  const recalc = React.useCallback(() => {
    const node = outerNodeRef.current;
    if (!node) return;

    const artEl =
      (node.querySelector(".icon-default > *") as HTMLElement | null) ??
      defaultSlotRef.current;
    if (!artEl) return;

    const a = node.getBoundingClientRect();
    const b = artEl.getBoundingClientRect();

    const ax = a.left + a.width / 2;
    const ay = a.top + a.height / 2;
    const bx = b.left + b.width / 2;
    const by = b.top + b.height / 2;

    node.style.setProperty("--icon-auto-x", `${ax - bx}px`);
    node.style.setProperty("--icon-auto-y", `${ay - by}px`);
  }, []);

  React.useLayoutEffect(() => {
    const node = outerNodeRef.current;
    if (!node) return;

    // 1) primer cálculo tras montar
    requestAnimationFrame(() => {
      requestAnimationFrame(recalc);
    });

    // 2) recálculo tardío por si entra por media query
    const t = setTimeout(recalc, 120);

    // 3) si hay imágenes, escuchar su load
    const imgs = node.querySelectorAll("img");
    const onLoad = () => recalc();
    imgs.forEach((img) => {
      if (img.complete) return;
      img.addEventListener("load", onLoad);
    });

    // 4) observar cambios de tamaño
    const ro = new ResizeObserver(recalc);
    ro.observe(node);
    if (defaultSlotRef.current) ro.observe(defaultSlotRef.current);

    // 5) cambios de ventana/orientación
    window.addEventListener("resize", recalc);
    window.addEventListener("orientationchange", recalc);

    return () => {
      clearTimeout(t);
      imgs.forEach((img) => img.removeEventListener("load", onLoad));
      ro.disconnect();
      window.removeEventListener("resize", recalc);
      window.removeEventListener("orientationchange", recalc);
    };
  }, [recalc]);

  const Inner = () => (
    <span
      className="relative inline-grid place-items-center"
      style={{ width: `${evenIconPx}px`, height: `${evenIconPx}px` }}
    >
      <span
        ref={defaultSlotRef}
        className="icon-default absolute inset-0 grid place-items-center"
      >
        {defaultIcon}
      </span>
      {hoverIconNode && (
        <span className="icon-hover absolute inset-0 grid place-items-center">
          {hoverIconNode}
        </span>
      )}
    </span>
  );

  type SharedProps = {
    className: string;
    style: StyleWithVars;
    "data-anim": HoverAnim;
    "aria-label"?: string;
    title?: string;
    ref: (el: HTMLSpanElement | HTMLButtonElement | null) => void;
  };

  const wrapperProps: SharedProps = {
    className: base,
    style: inlineStyle,
    "data-anim": hoverAnim,
    "aria-label": ariaLabel ?? title,
    title,
    ref: setOuterNode,
  };

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

      <style jsx global>{`
        .mj-iconmark {
          --mark-bg: var(--iconmark-bg);
          --mark-border: var(--iconmark-border);
          --mark-fg: var(--iconmark-icon-fg);
          --iconmark-radius: var(--radius-control, 12px);

          /* offsets que calcula el componente */
          --icon-auto-x: 0px;
          --icon-auto-y: 0px;
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

        /* El arte rellena el slot y aplica el offset de autocentrado */
        .mj-iconmark .icon-default > *,
        .mj-iconmark .icon-hover > * {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: contain;
          transform: translate(var(--icon-auto-x), var(--icon-auto-y));
        }

        /* animaciones */
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
