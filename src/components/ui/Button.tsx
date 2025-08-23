import { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "outline";
};

export default function Button({
  className = "",
  variant = "primary",
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition cursor-pointer " +
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950";
  const variants = {
    primary: "bg-brand-700 hover:bg-brand-600 text-white",
    outline: "border border-zinc-700 hover:border-zinc-500 text-zinc-100",
  };
  return (
    <button
      className={`${base} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
