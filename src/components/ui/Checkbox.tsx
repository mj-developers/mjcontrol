import { InputHTMLAttributes } from "react";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "id"> & {
  id: string;
  label: string;
};

export default function Checkbox({ id, label, ...props }: Props) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-2 text-sm text-zinc-200 select-none"
    >
      <input
        id={id}
        type="checkbox"
        className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-brand-700 focus:ring-brand-600"
        {...props}
      />
      {label}
    </label>
  );
}
