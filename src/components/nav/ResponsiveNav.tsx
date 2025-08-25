"use client";

import DesktopNav from "@/components/nav/DesktopNav";
import TabletNav from "@/components/nav/TabletNav";
import MobileNav from "@/components/nav/MobileNav";
import type { Theme } from "@/components/nav/DesktopNav";
import type { Dispatch, SetStateAction } from "react";

export default function ResponsiveNav({
  theme,
  setTheme,
  open,
  setOpen,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
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
