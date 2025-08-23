import { InputHTMLAttributes } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  id: string;
  hint?: string;
};

export default function TextField({
  label,
  id,
  type = "text",
  hint,
  ...props
}: Props) {
  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="text-sm text-zinc-200">
        {label}
      </label>
      <input
        id={id}
        type={type}
        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-zinc-100 placeholder:text-zinc-400
                   focus:border-zinc-700 focus:outline-none focus:ring-2 focus:ring-brand-600"
        {...props}
      />
      {hint && <p className="text-xs text-zinc-400">{hint}</p>}
    </div>
  );
}
