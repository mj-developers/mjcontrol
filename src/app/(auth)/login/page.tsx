"use client";
/* eslint-disable @next/next/no-img-element */

import dynamic from "next/dynamic";
import { useEffect, useState, type CSSProperties } from "react";
import Panel from "@/components/ui/Panel";
import Button from "@/components/ui/Button";
import TextField from "@/components/ui/TextField";
import ParticleBg from "@/components/ParticleBg";
import { getInitialTheme, setThemeGlobal, type Theme } from "@/lib/theme";
import { Sun, Moon } from "lucide-react";
import IconMark from "@/components/ui/IconMark";
import Logo from "@/components/Logo";
import Heading from "@/components/ui/Heading";

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
type PBVars = CSSProperties & {
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
      {/* Switch de tema */}
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

        {/* Medallón centrado sobre el ParticleBg (sin hover ni botón) */}
        <IconMark
          size={500}
          iconSize={400}
          asButton={false}
          interactive={false}
          hoverAnim="none"
          icon={
            <img
              src={
                isLight ? "/LogoPanelLoginLight.svg" : "/LogoPanelLoginDark.svg"
              }
              alt="MJ Devs"
            />
          }
          className="
            iconmark-hero iconmark-static
            absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
            rounded-full pointer-events-none select-none
          "
          ariaLabel="MJ Devs"
          title="MJ Devs"
        />
      </section>

      {/* DERECHA */}
      <section className="relative flex items-center justify-center p-6 lg:p-12 bg-[var(--login-right-bg)]">
        {/* Fondo móvil (overlay) */}
        <div className="absolute inset-0 lg:hidden">
          <ParticleBg fill style={mobileOverlayStyle} />
        </div>

        <div className="w-full max-w-md relative z-10 login-scope">
          {/* === Soft Deluxe wrapper (borde degradado + brillo sutil) === */}
          <div
            className={[
              "relative rounded-[var(--panel-radius,12px)] p-[1.25px]",
              "[background:linear-gradient(180deg,rgba(255,255,255,.14),rgba(255,255,255,0))]",
              "shadow-[0_0_0_1px_rgba(255,255,255,.06)]",
            ].join(" ")}
          >
            <Panel
              variant="soft"
              padding="lg"
              elevated
              bordered
              /* SIN lift ni desplazamiento */
              hoverLift={false}
              vignette="strong" /* "off" | "soft" | "strong" */
              pattern="diag" /* "none" | "grid" | "diag" */
              patternOpacity={0.2} /* menos marcado */
              patternGap={26} /* separación del entramado */
              patternThickness={1} /* grosor de líneas */
              /* 👉 Centrado VERTICAL del bloque completo dentro del panel */
              className="min-h-[600px] flex flex-col justify-center"
              header={
                <div className="flex justify-center">
                  <Logo
                    size={180}
                    rounded={0}
                    theme={isLight ? "light" : "dark"}
                    showText={false}
                    alt="mj-devs"
                  />
                </div>
              }
            >
              <Heading
                size={32}
                style={{ marginTop: 80, marginBottom: 30 }}
                level={1}
                align="center"
                fontFamily="var(--font-heading, ui-sans-serif)"
                weight={700}
                tracking="-0.01em"
                fill="gradient"
                gradientShape="linear"
                gradientFrom="#E0364F"
                gradientTo="#E6812A"
                gradientDirection="to right"
                gradientStops={[40, 100]}
                strokeWidth={0}
                strokeColor="rgba(0,0,0,.45)"
                shadow="custom"
                shadowCustom="0 10px 24px rgba(0,0,0,.35), 0 2px 0 rgba(0,0,0,.25)"
                underline={false}
                className="mb-10"
              >
                INICIAR SESIÓN
              </Heading>

              <form className="space-y-4" onSubmit={onSubmit} noValidate>
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

                <Button type="submit" fullWidth loading={loading}>
                  {loading ? "Entrando..." : "LOGIN"}
                </Button>
              </form>
            </Panel>
          </div>

          {/* === Footer debajo del panel (como antes) === */}
          <footer
            className="mt-6 text-center text-xs text-[var(--muted-fg)]"
            role="contentinfo"
          >
            © {new Date().getFullYear()} MJ Devs
          </footer>
        </div>
      </section>
    </div>
  );
}

export default dynamic(() => Promise.resolve(LoginPage), { ssr: false });
