"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import ParticleLinks from "@/components/ParticleLinks";

type Theme = "dark" | "light";

function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  // Tema SIN parpadeo: se decide en el cliente únicamente (no hay SSR)
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      const saved = localStorage.getItem("mj_theme") as Theme | null;
      if (saved === "light" || saved === "dark") return saved;
      if (window.matchMedia?.("(prefers-color-scheme: light)").matches)
        return "light";
    } catch {}
    return "dark";
  });

  useEffect(() => {
    try {
      localStorage.setItem("mj_theme", theme);
    } catch {}
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "dark" ? "light" : "dark"));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const fd = new FormData(e.currentTarget);
    const usuario = String(fd.get("usuario") || "").trim();
    const password = String(fd.get("password") || "").trim();
    if (usuario === "mjdevs" && password === "mjdevs") {
      document.cookie = `mj_auth=1; Path=/; SameSite=Lax`;
      router.replace("/");
      return;
    }
    setError("Usuario o contraseña incorrectos.");
  }

  const isLight = theme === "light";

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[7fr_5fr] relative">
      {/* Botón tema */}
      <button
        onClick={toggleTheme}
        aria-label="Cambiar tema"
        className={`fixed top-4 right-4 z-50 h-10 w-10 rounded-full 
                    shadow-md backdrop-blur border transition
                    ${
                      isLight
                        ? "bg-white/70 hover:bg-white border-zinc-200 text-zinc-900"
                        : "bg-zinc-900/70 hover:bg-zinc-900 border-zinc-700 text-zinc-100"
                    }`}
      >
        {isLight ? (
          // SOL con rayos
          <svg
            viewBox="0 0 24 24"
            className="mx-auto h-6 w-6"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
          </svg>
        ) : (
          // LUNA
          <svg
            viewBox="0 0 24 24"
            className="mx-auto h-6 w-6"
            fill="currentColor"
          >
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        )}
      </button>

      {/* IZQUIERDA (desktop) */}
      <section className="relative hidden lg:block">
        <ParticleLinks
          accent="#8E2434"
          count={80}
          linkDist={170}
          speed={60}
          bg="#E2E5EA"
          logo={isLight ? "/LogoMJDevsLight.svg" : "/LogoMJDevsDark.svg"}
          logoSize={460}
          logoYOffset={-0.06}
          circleBg={isLight ? "#ffffff" : "#0B0B0D"}
          circleBorder={isLight ? "#000000" : "#ffffff"}
          circleBorderWidth={4}
          lineBaseColor="#111111"
          lineBaseAlpha={0.16}
        />
      </section>

      {/* DERECHA: blanco en móvil oscuro; negro en desktop oscuro */}
      <section
        className={`relative flex items-center justify-center p-6 lg:p-12
          ${isLight ? "bg-zinc-100" : "bg-white lg:bg-zinc-950"}`}
      >
        {/* Fondo animado solo en móvil; sin círculo ni logo */}
        <div className="absolute inset-0 lg:hidden">
          <ParticleLinks
            accent="#8E2434"
            count={56}
            linkDist={150}
            speed={60}
            bg="transparent"
            showCenter={false}
            lineBaseColor="#111111"
            lineBaseAlpha={0.16}
          />
        </div>

        {/* Tarjeta de login (mismo look que en PC) */}
        <div className="w-full max-w-md relative z-10">
          <div
            className={
              isLight
                ? "rounded-2xl p-8 shadow-2xl min-h-[600px] border bg-white/80 border-zinc-200 text-zinc-900 backdrop-blur"
                : "rounded-2xl p-8 shadow-2xl min-h-[600px] border border-zinc-800 text-zinc-100 bg-[#141416] lg:bg-zinc-900/70 lg:backdrop-blur"
            }
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
                isLight ? "text-zinc-900" : ""
              }`}
            >
              Iniciar sesión
            </h1>

            <form
              className={`space-y-4 ${
                isLight ? "[&_label]:text-zinc-900 [&_input]:text-zinc-900" : ""
              }`}
              onSubmit={onSubmit}
              noValidate
            >
              <TextField
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
                className="w-full mt-2 cursor-pointer bg-gradient-to-b from-brand-700 to-brand-600 shadow-lg shadow-brand-900/25 hover:shadow-brand-800/40 hover:brightness-[1.03] active:scale-[.99]"
              >
                LOGIN
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

// ⬇️ Desactiva SSR para esta página (sin mismatch y sin “flash” de tema)
export default dynamic(() => Promise.resolve(LoginPage), { ssr: false });
