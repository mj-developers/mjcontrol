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
  // ✅ Inicializa el estado YA con el tema real (sin parpadeos)
  const [theme, setTheme] = useState<Theme>(() => getInitialTheme());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // ✅ Aplica el tema global cuando `theme` cambie (y solo entonces)
  useEffect(() => {
    setThemeGlobal(theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
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
  const leftBgStyle: PBVars = { ["--pl-bg"]: "var(--pl-left-bg)" };

  /* Overlay móvil: queremos transparencia */
  const mobileOverlayStyle: PBVars = { ["--pl-bg"]: "transparent" };

  return (
    <div className="login-grid min-h-[100svh] grid relative">
      {/* —— CSS de layout y tweaks por orientación —— */}
      <style jsx global>{`
        /* Base: una columna */
        .login-grid {
          grid-template-columns: 1fr;
        }

        /* Desktop y tablet landscape: 2 columnas 7/5 */
        @media (min-width: 1024px) and (orientation: landscape) {
          .login-grid {
            grid-template-columns: 7fr 5fr;
          }
        }

        /* Tablet portrait: apilar, centrar y usar hero pequeño */
        @media (min-width: 768px) and (orientation: portrait) {
          .login-grid {
            grid-template-columns: 1fr;
            grid-template-rows: 35vh 65vh;
          }

          .login-left {
            order: 1;
            position: relative;
          }

          .login-right {
            order: 2;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding-block: 16px;
          }

          .panel-wrap {
            margin-inline: auto !important;
          }

          /* Mostrar hero pequeño, ocultar grande */
          .hero-lg {
            display: none !important;
          }
          .hero-sm {
            display: block !important;
          }
        }

        /* Móvil portrait: panel un poco más alto y márgenes equilibrados */
        @media (max-width: 767px) and (orientation: portrait) {
          .login-right {
            padding-block: 26px;
          }
          .panel-base {
            min-height: min(640px, calc(100svh - 140px));
          }
        }

        /* Móvil landscape (alto pequeño): ocultar hero y usar solo el panel; sin scroll */
        @media (orientation: landscape) and (max-height: 480px) {
          .login-left {
            display: none !important;
          }
          .login-grid {
            grid-template-columns: 1fr;
          }
          .login-right {
            padding: 12px 16px;
            justify-content: center;
            align-items: center;
          }

          /* Partículas dentro del panel derecho */
          .login-right .mobile-overlay {
            display: block !important;
          }

          /* panel un poco más ancho */
          .panel-wrap {
            width: min(96vw, 840px);
            margin-inline: auto;
          }

          .panel-base {
            min-height: min(520px, calc(100svh - 110px));
            max-height: calc(100svh - 110px);
            overflow: hidden;
          }

          /* 2 columnas dentro del panel + más separación */
          .panel-content {
            display: grid !important;
            grid-template-columns: 1fr 1.1fr;
            align-items: center;
            gap: 24px;
          }
          .panel-left-col {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 14px;
          }
          .panel-right-col {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }
          .panel-logo {
            transform: scale(0.85);
          }
          .panel-title {
            margin-top: 0 !important;
            margin-bottom: 12px !important;
            font-size: clamp(20px, 4.2vh, 28px) !important;
          }
        }

        /* Desktop / tablet landscape: el panel vuelve a una sola columna */
        @media (min-width: 768px) and (orientation: landscape) {
          .panel-content {
            display: block;
          }
        }

        /* ====== Centrado del hero en todas las vistas ====== */
        .hero-center {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          pointer-events: none;
        }
        .hero-sm {
          display: none; /* por defecto escondido; se muestra en tablet portrait */
        }
      `}</style>

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

      {/* IZQUIERDA / ARRIBA (hero) */}
      <section className="login-left relative hidden md:block z-0">
        <ParticleBg fill style={leftBgStyle} />

        {/* Contenedor que centra siempre el contenido */}
        <div className="hero-center">
          {/* Variante GRANDE (desktop + tablet landscape) */}
          <IconMark
            size="xxxl"
            iconSize={400}
            asButton={false}
            interactive={false}
            hoverAnim="none"
            icon={
              <img
                src={
                  isLight
                    ? "/LogoPanelLoginLight.svg"
                    : "/LogoPanelLoginDark.svg"
                }
                alt="MJ Devs"
              />
            }
            className="hero-lg iconmark-hero iconmark-static rounded-full select-none"
            ariaLabel="MJ Devs"
            title="MJ Devs"
          />

          {/* Variante PEQUEÑA (solo tablet portrait) */}
          <IconMark
            size="heroSm"
            asButton={false}
            interactive={false}
            hoverAnim="none"
            icon={
              <img
                src={
                  isLight
                    ? "/LogoPanelLoginLight.svg"
                    : "/LogoPanelLoginDark.svg"
                }
                alt="MJ Devs"
              />
            }
            className="hero-sm iconmark-hero iconmark-static rounded-full select-none"
            style={{
              ["--iconmark-img-nudge-x"]: "30px",
              ["--iconmark-img-nudge-y"]: "35px",
            }}
          />
        </div>
      </section>

      {/* DERECHA / ABAJO (panel de login) */}
      <section className="login-right relative flex items-center justify-center p-6 lg:p-12 bg-[var(--login-right-bg)]">
        {/* Fondo móvil (overlay) – visible en móvil y forzado en landscape */}
        <div className="mobile-overlay absolute inset-0 md:hidden">
          <ParticleBg fill style={mobileOverlayStyle} />
        </div>

        {/* 👉 si quieres forzar re-montaje de todo el panel al cambiar tema, deja el key */}
        <div
          key={theme}
          className="w-full max-w-md relative z-10 login-scope panel-wrap"
        >
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
              hoverLift={false}
              vignette="strong"
              pattern="diag"
              patternOpacity={0.2}
              patternGap={26}
              patternThickness={1}
              className="panel-base"
            >
              <div className="panel-content">
                {/* Columna izquierda (logo + título) */}
                <div className="panel-left-col">
                  <div className="flex justify-center panel-logo">
                    <Logo
                      size={100}
                      rounded={0}
                      theme={isLight ? "light" : "dark"}
                      showText={false}
                      alt="mj-devs"
                    />
                  </div>

                  <Heading
                    size={32}
                    style={{ marginTop: 20, marginBottom: 30 }}
                    level={1}
                    align="center"
                    fontFamily="var(--font-heading, ui-sans-serif)"
                    weight={700}
                    tracking="-0.01em"
                    fill="solid"
                    color="var(--fg)"
                    strokeWidth={0}
                    underline={false}
                    className="mb-10 panel-title"
                  >
                    INICIAR SESIÓN
                  </Heading>
                </div>

                {/* Columna derecha (formulario) */}
                <div className="panel-right-col">
                  <form className="space-y-4" onSubmit={onSubmit} noValidate>
                    {/* Usuario */}
                    <Heading
                      id="hl-usuario"
                      level={2}
                      size={15}
                      align="left"
                      fontFamily="var(--font-heading, ui-sans-serif)"
                      weight={300}
                      tracking="-0.01em"
                      fill="solid"
                      color="var(--fg)"
                      shadow="soft"
                      underline={false}
                      className="mb-2"
                    >
                      Usuario
                    </Heading>

                    <TextField
                      id="usuario"
                      name="usuario"
                      label=""
                      aria-labelledby="hl-usuario"
                      autoComplete="username"
                      placeholder="MJ Devs"
                      required
                      onInvalid={(e) =>
                        (e.currentTarget as HTMLInputElement).setCustomValidity(
                          "Introduce tu usuario."
                        )
                      }
                      onInput={(e) =>
                        (e.currentTarget as HTMLInputElement).setCustomValidity(
                          ""
                        )
                      }
                    />

                    {/* Contraseña */}
                    <Heading
                      id="hl-password"
                      level={2}
                      size={15}
                      align="left"
                      fontFamily="var(--font-heading, ui-sans-serif)"
                      weight={300}
                      tracking="-0.01em"
                      fill="solid"
                      color="var(--fg)"
                      shadow="soft"
                      underline={false}
                      className="mb-2"
                    >
                      Contraseña
                    </Heading>

                    <TextField
                      id="password"
                      name="password"
                      type="password"
                      label=""
                      aria-labelledby="hl-password"
                      autoComplete="current-password"
                      placeholder="••••••••"
                      required
                      onInvalid={(e) =>
                        (e.currentTarget as HTMLInputElement).setCustomValidity(
                          "Introduce tu contraseña."
                        )
                      }
                      onInput={(e) =>
                        (e.currentTarget as HTMLInputElement).setCustomValidity(
                          ""
                        )
                      }
                    />

                    {error && <p className="text-sm text-red-400">{error}</p>}

                    <Button
                      type="submit"
                      width={"100%"}
                      height={40}
                      bg="var(--brand)"
                      fg="#fff"
                      borderColor="#fff"
                      fontFamily="var(--font-heading)"
                      labelWeight={700}
                      labelTracking="-0.01em"
                      textHoverScale={1.7}
                      loading={loading}
                    >
                      LOG IN
                    </Button>
                  </form>
                </div>
              </div>
            </Panel>
          </div>

          {/* Footer */}
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
