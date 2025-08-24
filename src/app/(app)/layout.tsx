"use client";

import { useEffect, useState, type CSSProperties } from "react";
import LeftNav from "@/components/LeftNav";
import { getInitialTheme, setThemeGlobal, type Theme } from "@/lib/theme";

type CSSVars = CSSProperties & { ["--nav-w"]?: string; ["--nav-gap"]?: string };

const NAV_OPEN = "16rem";
const NAV_CLOSED = "5rem";
const CONTENT_GAP = "2rem";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Relee lo que dejó el no-flash script y escucha cambios globales
    setTheme(getInitialTheme());
    const onTheme = (e: Event) => setTheme((e as CustomEvent<Theme>).detail);
    const onStorage = (e: StorageEvent) => {
      if (
        e.key === "mj_theme" &&
        (e.newValue === "light" || e.newValue === "dark")
      )
        setTheme(e.newValue);
    };
    window.addEventListener("mj:theme", onTheme as EventListener);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("mj:theme", onTheme as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  const style: CSSVars = {
    ["--nav-w"]: open ? NAV_OPEN : NAV_CLOSED,
    ["--nav-gap"]: CONTENT_GAP,
  };

  return (
    <div className="min-h-screen text-zinc-900 dark:text-white" style={style}>
      <LeftNav
        theme={theme}
        setTheme={(t) => {
          setTheme(t);
          setThemeGlobal(t);
        }}
        open={open}
        setOpen={setOpen}
      />
      <main className="min-h-screen p-6 pl-[calc(var(--nav-w)+var(--nav-gap))] transition-[padding] duration-300 ease-out">
        {children}
      </main>
    </div>
  );
}
