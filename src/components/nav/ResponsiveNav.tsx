"use client";

import { useEffect, useState } from "react";
import DesktopNav from "@/components/nav/DesktopNav";
import TabletNav from "@/components/nav/TabletNav";
import MobileNav from "@/components/nav/MobileNav";
import type { Theme } from "@/lib/theme";

type Variant = "desktop" | "tablet" | "mobile";

/** Clasificación mejorada:
 *  - Desktop: ancho >= 1024 y en landscape
 *  - Tablet: ancho >= 768 **y** (no es “phone-landscape” de baja altura)
 *  - Mobile: el resto (incluye teléfonos en landscape con poca altura)
 */
function computeVariant(): Variant {
  if (typeof window === "undefined") return "desktop";
  const w = window.innerWidth;
  const h = window.innerHeight;
  const isLandscape = w > h;
  const shortEdge = Math.min(w, h);

  // Desktop “de verdad”
  if (w >= 1024 && isLandscape) return "desktop";

  // Consideramos “phone-landscape” si la altura es pequeña (≤ 500)
  const phoneLandscape = isLandscape && h <= 500;

  if (w >= 768 && !phoneLandscape) return "tablet";

  return "mobile";
}

/** Soporte a Safari (addListener) */
function attachMqlChange(mql: MediaQueryList, fn: () => void): () => void {
  const handler = () => fn();
  if ("addEventListener" in mql) {
    mql.addEventListener("change", handler as EventListener);
    return () => mql.removeEventListener("change", handler as EventListener);
  }
  // @ts-expect-error Safari antiguo usa addListener/removeListener
  mql.addListener(handler);
  return () => {
    // @ts-expect-error Safari antiguo
    mql.removeListener(handler);
  };
}

export default function ResponsiveNav({
  theme,
  setTheme,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
}) {
  const [open, setOpen] = useState(false); // desktop rail plegado por defecto
  const [mounted, setMounted] = useState(false);
  const [variant, setVariant] = useState<Variant>("desktop");

  useEffect(() => {
    setMounted(true);
    const update = () => setVariant(computeVariant());
    const mql = window.matchMedia("(orientation: landscape)");

    update();
    window.addEventListener("resize", update);
    const detach = attachMqlChange(mql, update);

    return () => {
      window.removeEventListener("resize", update);
      detach();
    };
  }, []);

  if (!mounted) return null;

  if (variant === "desktop") {
    return (
      <DesktopNav
        theme={theme}
        setTheme={setTheme}
        open={open}
        setOpen={setOpen}
      />
    );
  }

  if (variant === "tablet") {
    return <TabletNav theme={theme} setTheme={setTheme} />;
  }

  return <MobileNav theme={theme} setTheme={setTheme} />;
}
