"use client";

import type React from "react";
import { useEffect, useState } from "react";
import Heading from "@/components/ui/Heading";
import IconMark from "@/components/ui/IconMark";
import { Wrench } from "lucide-react";
import { getInitialTheme, type Theme } from "@/lib/theme";

function useReactiveTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(getInitialTheme());
  useEffect(() => {
    const root = document.documentElement;
    const compute = () =>
      (root.classList.contains("dark") ? "dark" : "light") as Theme;
    setTheme(compute());
    const mo = new MutationObserver(() => setTheme(compute()));
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  return theme;
}

type MarkVars = React.CSSProperties & {
  ["--iconmark-bg"]?: string;
  ["--iconmark-border"]?: string;
  ["--iconmark-icon-fg"]?: string;
  ["--iconmark-hover-bg"]?: string;
  ["--iconmark-hover-border"]?: string;
  ["--iconmark-hover-icon-fg"]?: string;
};
type AccentVars = React.CSSProperties & { ["--accent"]?: string };

export default function ClientsPage() {
  const theme = useReactiveTheme();

  const subtleText = theme === "light" ? "text-zinc-600" : "text-zinc-400";
  const cardCls = [
    "mt-4 rounded-2xl border p-6 grid place-items-center text-center",
    theme === "light"
      ? "bg-white border-zinc-300"
      : "bg-[#0D1117] border-zinc-700",
  ].join(" ");

  const NORMAL_BORDER = theme === "light" ? "#0e1117" : "#ffffff";
  const NORMAL_BG = theme === "light" ? "#e2e5ea" : "#0b0b0d";
  const FG_NORMAL = theme === "light" ? "#010409" : "#ffffff";
  const FG_ACTIVE = theme === "light" ? "#0b0b0d" : "#ffffff";
  const markBrand = {
    ["--iconmark-bg"]: NORMAL_BG,
    ["--iconmark-border"]: NORMAL_BORDER,
    ["--iconmark-icon-fg"]: FG_NORMAL,
    ["--iconmark-hover-bg"]: "var(--brand,#8E2434)",
    ["--iconmark-hover-border"]: "var(--brand,#8E2434)",
    ["--iconmark-hover-icon-fg"]: FG_ACTIVE,
  } as MarkVars;

  // 👇 color de “Clientes” (mismo del icono activo)
  const ACCENT = "#F59E0B"; // amber-500

  return (
    <div className="p-4 md:p-6" style={{ "--accent": ACCENT } as AccentVars}>
      <header className="mb-4 md:mb-6">
        <Heading
          level={1}
          fill="solid"
          color="var(--accent, var(--brand,#8E2434))"
          fontFamily="var(--font-display, Sora, ui-sans-serif)"
          shadow="soft+brand"
          size="clamp(1.6rem,3.2vw,2.4rem)"
          className="uppercase tracking-widest"
        >
          Clientes
        </Heading>
        <p className={`mt-3 text-sm ${subtleText}`}>
          Página en construcción. Estamos trabajando para habilitar este módulo
          muy pronto.
        </p>
      </header>

      <section className={cardCls} aria-live="polite">
        <div className="flex items-center gap-3">
          <IconMark
            size="md"
            borderWidth={2}
            interactive
            hoverAnim="zoom"
            zoomScale={1.5}
            style={markBrand}
            title="En construcción"
            ariaLabel="En construcción"
          >
            <Wrench />
          </IconMark>
          <div className="text-left">
            <p className="font-medium">Módulo en construcción</p>
            <p className={`text-sm ${subtleText}`}>
              Pronto verás aquí el contenido de Clientes.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
