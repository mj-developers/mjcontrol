export type Theme = "light" | "dark";

declare global {
  interface Window {
    __MJ_THEME__?: Theme; // <- sin 'any'
  }
}

const BG = { light: "#ffffff", dark: "#0B0B0D" } as const;
const FG = { light: "#111111", dark: "#ffffff" } as const;

export function getStoredTheme(): Theme {
  try {
    const t = localStorage.getItem("mj_theme");
    if (t === "light" || t === "dark") return t;
  } catch {}
  return matchMedia?.("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function setThemeGlobal(t: Theme): void {
  try {
    localStorage.setItem("mj_theme", t);
  } catch {}
  if (typeof document !== "undefined") {
    const html = document.documentElement;
    html.setAttribute("data-theme", t);
    html.style.setProperty("--bg", BG[t]);
    html.style.setProperty("--fg", FG[t]);
  }
  window.__MJ_THEME__ = t; // <-- ahora está tipado, no 'any'
  window.dispatchEvent(new CustomEvent<Theme>("mj:theme", { detail: t }));
}

export function getInitialTheme(): Theme {
  return typeof window !== "undefined" && window.__MJ_THEME__
    ? window.__MJ_THEME__!
    : getStoredTheme();
}
