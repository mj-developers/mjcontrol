"use client";

import DesktopNav, { type Theme } from "./DesktopNav";
import TabletNav from "./TabletNav";
import MobileNav from "./MobileNav";

export default function ResponsiveNav({
  theme,
  setTheme,
  open,
  setOpen,
}: {
  theme: Theme;
  setTheme: (t: Theme) => void;
  open: boolean;
  setOpen: (v: boolean | ((o: boolean) => boolean)) => void;
}) {
  return (
    <>
      {/* Desktop: >= lg */}
      <div className="hidden lg:block">
        <DesktopNav
          theme={theme}
          setTheme={setTheme}
          open={open}
          setOpen={setOpen}
        />
      </div>

      {/* Tablet: md..lg-1 */}
      <div className="hidden md:block lg:hidden">
        <TabletNav theme={theme} setTheme={setTheme} />
      </div>

      {/* Mobile: < md */}
      <div className="block md:hidden">
        <MobileNav theme={theme} setTheme={setTheme} />
      </div>
    </>
  );
}
