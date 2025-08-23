import Image from "next/image";

export default function Logo({ size = 40 }: { size?: number }) {
  return (
    <div className="flex items-center gap-3">
      <Image
        src="/logo.svg"
        alt="mj-devs"
        width={size}
        height={size}
        className="rounded"
      />
      <span className="text-xl font-semibold tracking-wide">
        MJ Control CRM
      </span>
    </div>
  );
}
