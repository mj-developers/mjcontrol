import { InputHTMLAttributes } from "react";

type Theme = "light" | "dark";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
  hint?: string;
  tone?: Theme; // <- nuevo
};

export default function TextField({
  label,
  id,
  type = "text",
  hint,
  tone = "dark",
  ...props
}: Props) {
  const isLight = tone === "light";

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={id}
        className={`text-sm ${isLight ? "text-zinc-900" : "text-zinc-200"}`}
      >
        {label}
      </label>

      <input
        id={id}
        type={type}
        className={`w-full rounded-lg border px-3 py-2 transition-colors
          focus:outline-none focus:ring-2 focus:ring-brand-600
          ${
            isLight
              ? "bg-zinc-100 border-zinc-300 text-zinc-900 placeholder:text-zinc-500 focus:border-zinc-400"
              : "bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-400 focus:border-zinc-700"
          }`}
        {...props}
      />

      {hint && (
        <p className={`text-xs ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
          {hint}
        </p>
      )}
    </div>
  );
}
