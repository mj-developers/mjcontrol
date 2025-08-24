export type Theme = "light" | "dark";

declare global {
  interface Window {
    __MJ_THEME__?: Theme;
  }
}

const BG = { light: "#ffffff", dark: "#0B0B0D" } as const;
const FG = { light: "#111111", dark: "#ffffff" } as const;

export function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark"; // fallback SSR
  try {
    const t = window.localStorage.getItem("mj_theme");
    if (t === "light" || t === "dark") return t;
  } catch {}
  const mql = window.matchMedia?.("(prefers-color-scheme: light)");
  return mql?.matches ? "light" : "dark";
}

export function setThemeGlobal(t: Theme): void {
  try {
    window.localStorage.setItem("mj_theme", t);
  } catch {}
  const html = document.documentElement;
  html.setAttribute("data-theme", t);
  html.classList.toggle("dark", t === "dark");
  html.style.setProperty("--bg", t === "light" ? BG.light : BG.dark);
  html.style.setProperty("--fg", t === "light" ? FG.light : FG.dark);
  window.__MJ_THEME__ = t;
  window.dispatchEvent(new CustomEvent<Theme>("mj:theme", { detail: t }));
}

export function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark"; // no tocar window en SSR
  return window.__MJ_THEME__ ?? getStoredTheme();
}

export { BG, FG };
