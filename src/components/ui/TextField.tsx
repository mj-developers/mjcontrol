"use client";
import * as React from "react";

export type TextFieldProps = Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "size"
> & {
  label: string;
  id: string;
  hint?: string;
  error?: string;
  size?: "sm" | "md" | "lg";
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
};

const sizeVars = {
  sm: { h: "var(--field-h-sm,36px)", px: "12px", text: "text-sm" },
  md: { h: "var(--field-h-md,44px)", px: "14px", text: "text-base" },
  lg: { h: "var(--field-h-lg,52px)", px: "16px", text: "text-base" },
};

export default function TextField({
  label,
  id,
  type = "text",
  hint,
  error,
  size = "md",
  leftIcon,
  rightIcon,
  className = "",
  ...props
}: TextFieldProps) {
  const s = sizeVars[size];

  const inputClasses = [
    "w-full rounded-[var(--field-radius,12px)] border outline-none transition",
    "bg-[var(--field-bg,var(--input-bg,#0D1117))]",
    "text-[var(--field-fg,var(--fg,#fff))]",
    "placeholder-[color:var(--field-placeholder,var(--placeholder,#9ca3af))]",
    "border-[var(--field-border,var(--input-border,#374151))]",
    "focus:ring-2 focus:ring-[var(--brand,#8E2434)]",
    "focus:border-[var(--field-border,var(--input-border,#374151))]",
    error ? "ring-2 ring-red-500 focus:ring-red-500" : "",
    s.text,
    className,
  ].join(" ");

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className="text-sm text-[color:var(--label-fg,var(--muted-fg,#9ca3af))]"
      >
        {label}
      </label>

      <div className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {leftIcon}
          </span>
        )}

        <input
          id={id}
          type={type}
          className={inputClasses}
          style={{
            height: s.h as React.CSSProperties["height"],
            paddingLeft: leftIcon ? `calc(${s.px} + 24px)` : s.px,
            paddingRight: rightIcon ? `calc(${s.px} + 24px)` : s.px,
          }}
          {...props}
        />

        {rightIcon && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2">
            {rightIcon}
          </span>
        )}
      </div>

      {(hint || error) && (
        <p
          className={
            "text-xs " +
            (error
              ? "text-red-400"
              : "text-[color:var(--hint-fg,var(--muted-fg,#9ca3af))]")
          }
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
}
