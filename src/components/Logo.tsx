import Image from "next/image";
import * as React from "react";

type ThemeName = "light" | "dark";

export type LogoProps = {
  /** Tamaño (ancho/alto del símbolo) en px */
  size?: number;
  /** Tema para elegir el asset correcto */
  theme?: ThemeName;
  /** Rutas a los SVG por tema (overrideables si quieres) */
  lightSrc?: string;
  darkSrc?: string;
  /** Texto a la derecha del símbolo */
  text?: string;
  /** Mostrar/ocultar el texto */
  showText?: boolean;
  /** Radio del símbolo: true => tailwind .rounded; número => px */
  rounded?: boolean | number;
  /** Gap entre icono y texto (px) */
  gap?: number;
  /** Clases extra para el contenedor */
  className?: string;
  /** Alt accesible para el símbolo */
  alt?: string;
};

export default function Logo({
  size = 40,
  theme = "dark",
  lightSrc = "/LogoMJDevsSinTextoLight.svg",
  darkSrc = "/LogoMJDevsSinTextoDark.svg",
  text = "MJ Control CRM",
  showText = true,
  rounded = true,
  gap = 12,
  className = "",
  alt = "mj-devs",
}: LogoProps) {
  const src = theme === "light" ? lightSrc : darkSrc;

  const radiusClass =
    typeof rounded === "boolean" ? (rounded ? "rounded" : "") : ""; // si es número, lo metemos como style

  return (
    <div className={["flex items-center", className].join(" ")} style={{ gap }}>
      <Image
        src={src}
        alt={alt}
        width={size}
        height={size}
        className={radiusClass}
        style={
          typeof rounded === "number"
            ? ({ borderRadius: rounded } as React.CSSProperties)
            : undefined
        }
        priority
      />
      {showText && (
        <span className="text-xl font-semibold tracking-wide text-[color:var(--logo-text-fg,var(--fg))]">
          {text}
        </span>
      )}
    </div>
  );
}
