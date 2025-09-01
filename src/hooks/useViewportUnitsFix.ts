// src/hooks/useViewportUnitsFix.ts
"use client";

import { useEffect } from "react";

/**
 * Fija --vh como 1vh real en navegadores que NO soportan 100dvh,
 * reaccionando a cambios de tamaño/teclado/software bars.
 * Si el navegador soporta 100dvh, no hace nada.
 */
export default function useViewportUnitsFix() {
  useEffect(() => {
    const supportsDVH =
      typeof CSS !== "undefined" && CSS.supports("height", "100dvh");
    if (supportsDVH) return;

    const set = () => {
      const vh = window.innerHeight * 0.01; // 1vh real
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    // Primera medición
    set();

    // Listeners tipados (sin any)
    const onResizeWin: EventListener = () => set();

    window.addEventListener("resize", onResizeWin);

    // visualViewport puede no existir
    let removeVV: (() => void) | null = null;
    if (typeof window.visualViewport !== "undefined" && window.visualViewport) {
      const vv = window.visualViewport as VisualViewport;
      const onResizeVV: EventListener = () => set();
      vv.addEventListener("resize", onResizeVV);
      removeVV = () => vv.removeEventListener("resize", onResizeVV);
    }

    return () => {
      window.removeEventListener("resize", onResizeWin);
      if (removeVV) removeVV();
    };
  }, []);
}
