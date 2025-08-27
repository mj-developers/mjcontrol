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
};

const sizeMap: Record<Size, { h: string; px: string; text: string }> = {
  sm: { h: "var(--btn-h-sm,36px)", px: "12px", text: "text-sm" },
  md: { h: "var(--btn-h-md,48px)", px: "16px", text: "text-sm" },
  lg: { h: "var(--btn-h-lg,56px)", px: "20px", text: "text-base" },
};

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
  ...props
}: ButtonProps) {
  const s = sizeMap[size];
  const isDisabled = disabled || loading;

  const base =
    "mj-btn relative inline-flex items-center justify-center rounded-[var(--btn-radius,12px)] " +
    "transition select-none " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand,#8E2434)]/60 " +
    "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--btn-ring-offset,var(--surface-1,#0D1117))]";

  return (
    <button
      data-variant={variant}
      data-size={size}
      disabled={isDisabled}
      className={[
        base,
        "border",
        "text-[var(--btn-fg,#fff)]",
        "bg-[var(--btn-bg,var(--brand,#8E2434))]",
        "border-[var(--btn-border,transparent)]",
        "shadow-[var(--btn-shadow,0_12px_24px_rgba(142,36,52,.28))]",
        "hover:[background:var(--btn-hover-bg,var(--btn-bg))]",
        "hover:shadow-[var(--btn-shadow-hover,var(--btn-shadow))]",
        isDisabled ? "opacity-70 pointer-events-none" : "cursor-pointer",
        sizeMap[size].text,
        fullWidth ? "w-full" : "",
        className,
      ].join(" ")}
      style={{
        height: s.h as React.CSSProperties["height"],
        paddingInline: s.px,
      }}
      {...props}
    >
      {loading && (
        <span className="absolute left-3 inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      <span className={loading ? "opacity-80" : ""}>{children}</span>
      {rightIcon && <span className="ml-2">{rightIcon}</span>}

      {/* Variantes por data-attr → asignan tokens (overrideables en tema) */}
      <style jsx global>{`
        .mj-btn[data-variant="primary"] {
          --btn-bg: var(
            --btn-primary-bg,
            linear-gradient(
              to bottom,
              var(--brand-600, #9b2e40),
              var(--brand, #8e2434)
            )
          );
          --btn-hover-bg: var(--btn-primary-hover-bg, var(--brand, #8e2434));
          --btn-fg: var(--btn-primary-fg, #fff);
          --btn-border: var(--btn-primary-border, transparent);
          --btn-shadow: var(
            --btn-primary-shadow,
            0 12px 24px rgba(var(--brand-rgb, 142 36 52), 0.28)
          );
          --btn-shadow-hover: var(
            --btn-primary-shadow-hover,
            0 16px 28px rgba(var(--brand-rgb, 142 36 52), 0.36)
          );
        }
        .mj-btn[data-variant="outline"] {
          --btn-bg: var(--btn-outline-bg, transparent);
          --btn-hover-bg: var(
            --btn-outline-hover-bg,
            rgba(255, 255, 255, 0.06)
          );
          --btn-fg: var(--btn-outline-fg, var(--fg, #fff));
          --btn-border: var(--btn-outline-border, #3f3f46);
          --btn-shadow: var(--btn-outline-shadow, none);
          --btn-shadow-hover: var(--btn-outline-shadow-hover, none);
        }
        .mj-btn[data-variant="ghost"] {
          --btn-bg: var(--btn-ghost-bg, transparent);
          --btn-hover-bg: var(--btn-ghost-hover-bg, rgba(255, 255, 255, 0.06));
          --btn-fg: var(--btn-ghost-fg, var(--fg, #fff));
          --btn-border: var(--btn-ghost-border, transparent);
          --btn-shadow: var(--btn-ghost-shadow, none);
          --btn-shadow-hover: var(--btn-ghost-shadow-hover, none);
        }
      `}</style>
    </button>
  );
}
