"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import ParticleBg from "@/components/ParticleBg";
import { getInitialTheme, setThemeGlobal, type Theme } from "@/lib/theme";
import { Sun, Moon } from "lucide-react";
import IconMark from "@/components/ui/IconMark";

/* helpers parseo */
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function extractErrorMessage(v: unknown): string | null {
  if (!isRecord(v)) return null;
  const maybe = v["error"];
  return typeof maybe === "string" && maybe.trim().length > 0 ? maybe : null;
}

/* Tipado para overrides de ParticleBg */
type PBVars = React.CSSProperties & {
  ["--pl-bg"]?: string;
  ["--pl-link-color"]?: string;
  ["--pl-link-alpha"]?: string;
  ["--pl-accent"]?: string;
};

function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const t = getInitialTheme();
    setTheme(t);
    setThemeGlobal(t);
  }, []);

  function toggleTheme() {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      setThemeGlobal(next);
      return next;
    });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const fd = new FormData(e.currentTarget);
      const usuario = String(fd.get("usuario") || "").trim();
      const password = String(fd.get("password") || "").trim();
      if (!usuario || !password) {
        setError("Introduce usuario y contraseña.");
        return;
      }
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: usuario, password }),
        credentials: "include",
      });
      let data: unknown = null;
      try {
        data = await res.json();
      } catch {}
      if (!res.ok) {
        setError(
          extractErrorMessage(data) ?? "Usuario o contraseña incorrectos."
        );
        return;
      }
      const next = new URLSearchParams(window.location.search).get("next");
      window.location.assign(next || "/");
    } catch {
      setError("No se pudo iniciar sesión. Revisa tu conexión.");
    } finally {
      setLoading(false);
    }
  }

  const isLight = theme === "light";
  const tone = isLight ? "light" : "dark";

  /* ParticleBg: columna izquierda usa el token del tema */
  const leftBgStyle: PBVars = {
    ["--pl-bg"]: "var(--pl-left-bg)",
  };

  /* Overlay móvil: queremos transparencia */
  const mobileOverlayStyle: PBVars = {
    ["--pl-bg"]: "transparent",
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[7fr_5fr] relative">
      <IconMark
        asButton
        onClick={toggleTheme}
        ariaLabel={isLight ? "Cambiar a oscuro" : "Cambiar a claro"}
        title={isLight ? "Cambiar a oscuro" : "Cambiar a claro"}
        size="md"
        borderWidth={2}
        interactive
        icon={isLight ? <Sun /> : <Moon />}
        hoverIcon={isLight ? <Moon /> : <Sun />}
        hoverAnim="cycle"
        cycleOffset={12}
        cycleAngleDeg={35}
        cycleRotateDeg={16}
        className="fixed top-4 right-4 z-50"
      />

      {/* IZQUIERDA (desktop) */}
      <section className="relative hidden lg:block z-0">
        <ParticleBg fill style={leftBgStyle} />
      </section>

      {/* DERECHA */}
      <section
        className={
          "relative flex items-center justify-center p-6 lg:p-12 bg-[var(--login-right-bg)]"
        }
      >
        {/* Fondo móvil (overlay) */}
        <div className="absolute inset-0 lg:hidden">
          <ParticleBg fill style={mobileOverlayStyle} />
        </div>

        <div className="w-full max-w-md relative z-10 login-scope">
          <div
            className={[
              "rounded-2xl p-8 shadow-2xl min-h-[600px] border",
              "bg-[var(--login-panel-bg)]",
              "border-[var(--login-panel-border)]",
              "text-[var(--login-panel-fg)]",
            ].join(" ")}
          >
            <div className="mb-4 flex justify-center">
              <img
                src={isLight ? "/LogoMJDevsLight.svg" : "/LogoMJDevsDark.svg"}
                alt="mj-devs"
                className="h-16 w-auto"
              />
            </div>

            <h1 className="mb-6 text-center text-3xl font-display font-semibold">
              Iniciar sesión
            </h1>

            <form className="space-y-4" onSubmit={onSubmit} noValidate>
              <TextField
                tone={tone}
                id="usuario"
                name="usuario"
                label="Usuario"
                autoComplete="username"
                placeholder="MJ Devs"
                required
                onInvalid={(e) =>
                  (e.currentTarget as HTMLInputElement).setCustomValidity(
                    "Introduce tu usuario."
                  )
                }
                onInput={(e) =>
                  (e.currentTarget as HTMLInputElement).setCustomValidity("")
                }
              />
              <TextField
                tone={tone}
                id="password"
                name="password"
                type="password"
                label="Contraseña"
                autoComplete="current-password"
                placeholder="••••••••"
                required
                onInvalid={(e) =>
                  (e.currentTarget as HTMLInputElement).setCustomValidity(
                    "Introduce tu contraseña."
                  )
                }
                onInput={(e) =>
                  (e.currentTarget as HTMLInputElement).setCustomValidity("")
                }
              />

              {error && <p className="text-sm text-red-400">{error}</p>}

              <Button
                type="submit"
                disabled={loading}
                className={[
                  "relative w-full mt-2 inline-flex items-center justify-center h-12 rounded-xl px-6",
                  "font-semibold tracking-[.12em]",
                  "text-[var(--login-btn-fg)]",
                  "border border-[var(--login-btn-border)]",
                  "bg-[var(--login-btn-bg)]",
                  "hover:bg-[var(--login-btn-hover)] hover:bg-none",
                  "before:absolute before:inset-0 before:rounded-xl",
                  "before:bg-[linear-gradient(to_bottom,rgba(255,255,255,.14),rgba(0,0,0,0))] before:pointer-events-none",
                  "after:absolute after:inset-0 after:rounded-xl after:opacity-0",
                  "after:bg-[var(--login-btn-glow)]",
                  "hover:after:opacity-100",
                  "transition-all duration-200 hover:translate-y-[-1px] active:translate-y-0 active:scale-[.99]",
                  "shadow-[var(--login-btn-shadow)] hover:shadow-[var(--login-btn-shadow-hover)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/60",
                  "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--login-panel-bg-for-ring)]",
                  loading ? "opacity-70 pointer-events-none" : "cursor-pointer",
                ].join(" ")}
              >
                {loading ? "Entrando..." : "LOGIN"}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-[var(--muted-fg)]">
            © {new Date().getFullYear()} MJ Devs
          </p>
        </div>
      </section>
    </div>
  );
}

export default dynamic(() => Promise.resolve(LoginPage), { ssr: false });
