"use client";

import * as React from "react";
import Image from "next/image";

export type MJSpinnerProps = {
  /** Tamaño total del spinner (px, rem, etc). Ej: 64, "72px", "5rem" */
  size?: number | string;
  /** Grosor del aro (en px) */
  thickness?: number;
  /** Velocidad del aro (ms por vuelta) */
  speed?: number;
  /** Velocidad del logo (ms por vuelta, sentido contrario) */
  counterSpeed?: number;
  /** Color acento del aro (usa tu brand por defecto) */
  accent?: string;
  /** Ruta del logo (usa /public) */
  logoSrc?: string;
  /** Texto accesible para lectores de pantalla */
  label?: string;
  /** Si true, pinta un overlay a pantalla completa */
  overlay?: boolean;
  /** Clases extra */
  className?: string;
  /** Porcentaje de arco visible del aro */
  sweep?: number; // 0..100
};

/** Variables CSS personalizadas (para evitar any) */
type SpinnerVars = {
  ["--acc"]?: string;
  ["--thk"]?: string;
  ["--spd"]?: string;
  ["--rev"]?: string;
  ["--sweep"]?: string;
};

export default function MJSpinner({
  size = 72,
  thickness = 5,
  speed = 1100,
  counterSpeed = 2200,
  accent = "var(--brand, #8E2434)",
  logoSrc = "/LogoMJDevsSinTextoDark.svg",
  label = "Cargando…",
  overlay = false,
  className = "",
  sweep = 35,
}: MJSpinnerProps) {
  const dim = typeof size === "number" ? `${size}px` : size;
  const clampSweep = Math.max(5, Math.min(95, sweep));

  const cssVars: SpinnerVars = {
    "--acc": accent,
    "--thk": `${thickness}px`,
    "--spd": `${speed}ms`,
    "--rev": `${counterSpeed}ms`,
    "--sweep": `${clampSweep}%`,
  };

  return (
    <div
      className={[
        overlay
          ? "fixed inset-0 z-[9999] grid place-items-center bg-black/30 backdrop-blur-[2px]"
          : "inline-grid place-items-center",
        className,
      ].join(" ")}
      aria-busy="true"
      aria-live="polite"
      role="status"
    >
      <div
        className="relative"
        style={{ width: dim, height: dim, ...cssVars } as React.CSSProperties}
      >
        {/* Aro con conic-gradient (gira) */}
        <div className="mj-ring" />

        {/* Disco interior con borde + glow suave */}
        <div className="mj-inner bg-white dark:bg-[#0D1117] border border-zinc-300 dark:border-zinc-700" />

        {/* Logo (gira al revés) */}
        <div className="mj-logo-wrap">
          <div className="mj-logo-box">
            <Image
              src={logoSrc}
              alt=""
              fill
              sizes="(max-width: 2000px) 100vw, 100vw"
              className="mj-logo"
              priority={false}
            />
          </div>
        </div>

        {/* A11y */}
        <span className="sr-only">{label}</span>
      </div>

      {/* estilos / animaciones locales */}
      <style jsx>{`
        .mj-ring {
          position: absolute;
          inset: 0;
          border-radius: 9999px;
          background: conic-gradient(
            from 0deg,
            var(--acc) 0 var(--sweep),
            transparent var(--sweep) 100%
          );
          -webkit-mask: radial-gradient(
            farthest-side,
            transparent calc(100% - var(--thk)),
            #000 calc(100% - var(--thk))
          );
          mask: radial-gradient(
            farthest-side,
            transparent calc(100% - var(--thk)),
            #000 calc(100% - var(--thk))
          );
          animation: mj-spin var(--spd) linear infinite;
          filter: drop-shadow(
            0 0 10px color-mix(in srgb, var(--acc), transparent 70%)
          );
        }

        .mj-inner {
          position: absolute;
          inset: calc(var(--thk) + 1px);
          border-radius: 9999px;
          animation: mj-glow 2400ms ease-in-out infinite;
        }

        .mj-logo-wrap {
          position: absolute;
          inset: calc(var(--thk) + 10px);
          display: grid;
          place-items: center;
        }

        .mj-logo-box {
          position: relative;
          width: 70%;
          height: 70%;
        }

        .mj-logo {
          animation: mj-spin-rev var(--rev) linear infinite;
          object-fit: contain;
          filter: drop-shadow(0 1px 0 rgba(0, 0, 0, 0.06));
        }

        @keyframes mj-spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes mj-spin-rev {
          to {
            transform: rotate(-360deg);
          }
        }
        @keyframes mj-glow {
          0%,
          100% {
            box-shadow: 0 0 0 rgba(0, 0, 0, 0);
          }
          50% {
            box-shadow: 0 0 22px color-mix(in srgb, var(--acc), transparent 70%);
          }
        }
      `}</style>
    </div>
  );
}
