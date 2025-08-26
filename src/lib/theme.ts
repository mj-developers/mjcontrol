// src/lib/theme.ts
export type Theme = "light" | "dark";

declare global {
  interface Window {
    __MJ_THEME__?: Theme;
  }
}

export function getStoredTheme(): Theme {
  try {
    const t = localStorage.getItem("mj_theme");
    if (t === "light" || t === "dark") return t;
  } catch {}
  return window.matchMedia?.("(prefers-color-scheme: light)").matches
    ? "light"
    : "dark";
}

export function setThemeGlobal(t: Theme) {
  try {
    localStorage.setItem("mj_theme", t);
  } catch {}
  document.documentElement.dataset.theme = t;
  document.documentElement.classList.toggle("dark", t === "dark");
  window.__MJ_THEME__ = t;
  window.dispatchEvent(new CustomEvent<Theme>("mj:theme", { detail: t }));
}

export function getInitialTheme(): Theme {
  return window.__MJ_THEME__ ?? getStoredTheme();
}
