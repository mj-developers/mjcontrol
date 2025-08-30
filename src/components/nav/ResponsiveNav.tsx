// src/components/nav/ResponsiveNav.tsx
"use client";

import { useEffect, useState } from "react";
import DesktopNav from "@/components/nav/DesktopNav";
import TabletNav from "@/components/nav/TabletNav";
import MobileNav from "@/components/nav/MobileNav";
import type { Theme } from "@/lib/theme";

type Variant = "desktop" | "tablet" | "mobile";

function computeVariant(): Variant {
  if (typeof window === "undefined") return "desktop"; // SSR placeholder
  const w = window.innerWidth;
  const isLandscape = window.matchMedia("(orientation: landscape)").matches;
  if (w >= 1024 && isLandscape) return "desktop";
  if (w >= 768) return "tablet";
  return "mobile";
}

/** Soporte a Safari (addListener) sin usar `any` */
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
  // Menú desktop plegado por defecto
  const [open, setOpen] = useState(false);

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

  // Evitamos parpadeos/hydration mismatch
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
