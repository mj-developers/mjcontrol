"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import ParticleLinks from "@/components/ParticleLinks";
import { getInitialTheme, setThemeGlobal, type Theme } from "@/lib/theme";
import { Sun, Moon } from "lucide-react";

function LoginPage() {
  const router = useRouter();
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
        credentials: "include", // recibe la cookie del mismo origen
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error || "Usuario o contraseña incorrectos.");
        return;
      }

      // Respeta el ?next= que el middleware puso al redirigir
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

  const btnTheme = isLight
    ? "bg-[#8E2434] text-white"
    : "bg-[#8E2434] text-black";

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[7fr_5fr] relative">
      <button
        onClick={toggleTheme}
        aria-label="Cambiar tema"
        type="button"
        className={`fixed top-4 right-4 z-50 h-10 w-10 rounded-full 
              shadow-md backdrop-blur border transition
              grid place-items-center  /* ⬅️ centra el contenido */
              hover:cursor-pointer focus-visible:cursor-pointer
              ${
                isLight
                  ? "bg-white/70 hover:bg-white border-zinc-200 text-zinc-900"
                  : "bg-zinc-900/70 hover:bg-zinc-900 border-zinc-700 text-zinc-100"
              }`}
      >
        <span className="grid place-items-center h-7 w-7 leading-none transition-transform group-hover:scale-110">
          <Sun className="h-6 w-6 icon-light" />
          <Moon className="h-6 w-6 icon-dark" />
        </span>
      </button>

      {/* IZQUIERDA (desktop) */}
      <section className="relative hidden lg:block">
        <ParticleLinks
          accent="#8E2434"
          count={80}
          linkDist={170}
          speed={60}
          bg={isLight ? "#FFFFFF" : "#E2E5EA"}
          logo={
            isLight ? "/LogoPanelLoginLight.svg" : "/LogoPanelLoginDark.svg"
          }
          logoSize={460}
          logoYOffset={0.0}
          circleBg="#8E2434"
          circleBorder={isLight ? "#FFFFFF" : "#000000"}
          circleBorderWidth={4}
          lineBaseColor="#3A3A3A"
          lineBaseAlpha={0.16}
        />
      </section>

      {/* DERECHA */}
      <section
        className={`relative flex items-center justify-center p-6 lg:p-12 ${
          isLight ? "bg-[#F6F8FA]" : "bg-[#010409]"
        }`}
      >
        <div className="absolute inset-0 lg:hidden">
          <ParticleLinks
            accent="#8E2434"
            count={56}
            linkDist={150}
            speed={60}
            bg="transparent"
            showCenter={false}
            lineBaseColor="#3A3A3A"
            lineBaseAlpha={0.16}
          />
        </div>

        <div className="w-full max-w-md relative z-10 login-scope">
          <div
            className={`rounded-2xl p-8 shadow-2xl min-h-[600px] border ${
              isLight
                ? "bg-white border-zinc-200 text-black"
                : "bg-[#0D1117] border-zinc-800 text-white"
            }`}
          >
            <div className="mb-4 flex justify-center">
              <img
                src={isLight ? "/LogoMJDevsLight.svg" : "/LogoMJDevsDark.svg"}
                alt="mj-devs"
                className="h-16 w-auto"
              />
            </div>

            <h1
              className={`mb-6 text-center text-3xl font-display font-semibold ${
                isLight ? "text-black" : "text-white"
              }`}
            >
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
                  "relative w-full mt-2 inline-flex items-center justify-center h-12 rounded-xl",
                  "px-6 font-semibold tracking-[.12em]",
                  "text-[var(--login-btn-fg)] border border-[var(--login-btn-border)]",
                  "bg-[var(--login-btn-bg)]",
                  "[background-image:linear-gradient(to_bottom,#9b2e40,#8E2434)]",
                  "hover:bg-[var(--login-btn-hover)] hover:bg-none",
                  "before:absolute before:inset-0 before:rounded-xl",
                  "before:bg-[linear-gradient(to_bottom,rgba(255,255,255,.14),rgba(0,0,0,0))] before:pointer-events-none",
                  "after:absolute after:inset-0 after:rounded-xl after:opacity-0",
                  "after:bg-[radial-gradient(120%_80%_at_50%_-20%,rgba(255,255,255,.35),transparent_40%)]",
                  "hover:after:opacity-100",
                  "transition-all duration-200 hover:translate-y-[-1px] active:translate-y-0 active:scale-[.99]",
                  "shadow-[0_12px_24px_rgba(142,36,52,.28)] hover:shadow-[0_16px_28px_rgba(142,36,52,.36)]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]/60",
                  "focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--login-panel-bg)]",
                  loading ? "opacity-70 pointer-events-none" : "cursor-pointer",
                ].join(" ")}
              >
                {loading ? "Entrando..." : "LOGIN"}
              </Button>
            </form>
          </div>

          <p
            className={`mt-6 text-center text-xs ${
              isLight ? "text-zinc-500" : "text-zinc-400"
            }`}
          >
            © {new Date().getFullYear()} MJ Devs
          </p>
        </div>
      </section>
    </div>
  );
}

export default dynamic(() => Promise.resolve(LoginPage), { ssr: false });
