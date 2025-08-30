"use client";

import { useEffect, useState } from "react";
import ResponsiveNav from "@/components/nav/ResponsiveNav";
import { getInitialTheme, setThemeGlobal, type Theme } from "@/lib/theme";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [open, setOpen] = useState(true); // ancho 14rem en desktop cuando está abierto

  // hidrata con el tema inicial y aplica al <html>
  useEffect(() => {
    const t = getInitialTheme();
    setTheme(t);
    setThemeGlobal(t);
  }, []);

  // sincroniza el ancho de nav con una CSS var global para desplazar el contenido en desktop
  useEffect(() => {
    const root = document.documentElement;
    // Desktop: 14rem si abierto, 5rem si contraído.
    root.style.setProperty("--nav-w", open ? "14rem" : "5rem");
    return () => {
      root.style.removeProperty("--nav-w");
    };
  }, [open]);

  const setThemeBoth = (t: Theme) => {
    setTheme(t);
    setThemeGlobal(t);
  };

  return (
    <div className="app-shell">
      <ResponsiveNav
        theme={theme}
        setTheme={setThemeBoth}
        open={open}
        setOpen={setOpen}
      />
      <main className="app-content">{children}</main>

      {/* padding responsivo para el contenido (tablet/desktop). 
          En móvil no aplicamos padding-left, la MobileNav ya reserva bottom. */}
      <style jsx global>{`
        .app-shell {
          min-height: 100svh;
        }
        @media (min-width: 768px) {
          /* Tablet (rail fijo 5rem) */
          .app-shell .app-content {
            padding-left: 5rem;
          }
        }
        @media (min-width: 1024px) {
          /* Desktop (usa --nav-w dinámico) */
          .app-shell .app-content {
            padding-left: var(--nav-w, 5rem);
          }
        }
        @media (max-width: 767px) {
          /* Mobile: la barra inferior ya deja hueco con padding-bottom propio */
          .app-shell .app-content {
            padding-left: 0;
          }
        }
      `}</style>
    </div>
  );
}
