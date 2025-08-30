// src/lib/theme.ts
export type Theme = "light" | "dark";

declare global {
  interface Window {
    __MJ_THEME__?: Theme;
  }
}

const KEY = "mj_theme";

/** Lee el tema guardado; si no hay, usa prefers-color-scheme */
export function getStoredTheme(): Theme {
  try {
    const t = localStorage.getItem(KEY);
    if (t === "light" || t === "dark") return t;
  } catch {
    /* ignore */
  }
  // Si el SO prefiere claro → "light", si no → "dark"
  const prefersLight =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: light)")?.matches;
  return prefersLight ? "light" : "dark";
}

/** Aplica el tema al DOM (sin CSS vars inline) */
function applyToDOM(t: Theme) {
  const html = document.documentElement;
  html.setAttribute("data-theme", t);
  // Mantén esto si usas Tailwind con dark:"class"
  html.classList.toggle("dark", t === "dark");
}

/** Cambia el tema global, persiste y emite evento diferido */
export function setThemeGlobal(t: Theme) {
  try {
    localStorage.setItem(KEY, t);
  } catch {
    /* ignore */
  }
  applyToDOM(t);
  window.__MJ_THEME__ = t;

  // Diferimos el evento para no cruzar renders en React
  requestAnimationFrame(() => {
    window.dispatchEvent(new CustomEvent<Theme>("mj:theme", { detail: t }));
  });
}

/** Tema inicial: usa el inyectado (si existe) o almacenado/preferido */
export function getInitialTheme(): Theme {
  return typeof window !== "undefined" && window.__MJ_THEME__
    ? window.__MJ_THEME__!
    : getStoredTheme();
}
