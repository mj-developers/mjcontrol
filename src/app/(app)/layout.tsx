// src/app/(app)/layout.tsx
"use client";

import { useEffect, useState } from "react";
import ResponsiveNav from "@/components/nav/ResponsiveNav";
import { getInitialTheme, setThemeGlobal, type Theme } from "@/lib/theme";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  // Tema inicial + sincroniza con <html>
  useEffect(() => {
    const t = getInitialTheme();
    setTheme(t);
    setThemeGlobal(t);
  }, []);

  const setThemeBoth = (t: Theme) => {
    setTheme(t);
    setThemeGlobal(t);
  };

  return (
    <div className="app-shell">
      <ResponsiveNav theme={theme} setTheme={setThemeBoth} />
      <main className="app-content">{children}</main>

      <style jsx global>{`
        .app-shell {
          min-height: 100svh;
        }

        /* ====== Valores base (móvil) ====== */
        .app-shell .app-content {
          /* base para móvil */
          --gap-md: 16px;
          padding-top: var(--gap-md);
          padding-right: var(--gap-md);
          padding-bottom: var(--gap-md);
          padding-left: var(--gap-md);
        }

        /* Móvil landscape: fuerza también margen izquierdo (antes se pegaba) */
        @media (max-width: 767px) and (orientation: landscape) {
          .app-shell .app-content {
            --gap-md: 16px;
            padding-left: var(--gap-md);
            padding-right: var(--gap-md);
          }
        }

        /* ====== Tablet (rail fijo 5rem) ====== */
        @media (min-width: 768px) and (max-width: 1023px) {
          .app-shell .app-content {
            --tab-gap: 20px;
            padding-top: var(--tab-gap);
            padding-right: var(--tab-gap);
            padding-bottom: var(--tab-gap);
            /* Rail 5rem + margen extra */
            padding-left: calc(5rem + var(--tab-gap));
          }
        }

        /* ====== Desktop (usa --nav-w dinámico) ====== */
        @media (min-width: 1024px) {
          .app-shell .app-content {
            --gap-lg: 24px;
            /* Ajusta aquí el “aire” respecto al menú */
            --page-left-extra: 36px; /* súbelo si quieres aún más separación */
            padding-top: var(--gap-lg);
            padding-right: var(--gap-lg);
            padding-bottom: var(--gap-lg);
            padding-left: calc(var(--nav-w, 5rem) + var(--page-left-extra));
          }
        }
      `}</style>
    </div>
  );
}
