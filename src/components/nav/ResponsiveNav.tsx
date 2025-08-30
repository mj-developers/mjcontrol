"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import DesktopNav from "@/components/nav/DesktopNav";
import TabletNav from "@/components/nav/TabletNav";
import MobileNav from "@/components/nav/MobileNav";
import type { Theme } from "@/lib/theme";

/**
 * Arranca con el menú plegado en desktop (open=false).
 * Si prefieres controlar open desde fuera, puedes volver a exponerlo por props.
 */
export default function ResponsiveNav({
  theme,
  setTheme,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
}) {
  const [open, setOpen] = useState<boolean>(false); // ← plegado por defecto

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block">
        <DesktopNav
          theme={theme}
          setTheme={setTheme}
          open={open}
          setOpen={setOpen}
        />
      </div>

      {/* Tablet (rail fijo) */}
      <div className="hidden md:block lg:hidden">
        <TabletNav theme={theme} setTheme={setTheme} />
      </div>

      {/* Mobile (barra inferior) */}
      <div className="block md:hidden">
        <MobileNav theme={theme} setTheme={setTheme} />
      </div>
    </>
  );
}
