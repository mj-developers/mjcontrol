// src/app/(app)/page.tsx
"use client";

import type React from "react";
import { useEffect, useId, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Users,
  Building2,
  AppWindow,
  BadgeCheck,
  ArrowUpRight,
  ArrowDownRight,
  Clock8,
} from "lucide-react";
import IconMark from "@/components/ui/IconMark";
import Heading from "@/components/ui/Heading";

/* =======================================================================
   Colores utilitarios
   ======================================================================= */
const TWC = {
  indigo: { 500: "#6366F1" },
  cyan: { 500: "#06B6D4" },
  violet: { 500: "#8B5CF6" },
  emerald: { 500: "#10B981" },
  amber: { 500: "#F59E0B" },
};
const BRAND = "#8E2434";

const toRGB = (hex: string) => {
  const h = hex.replace("#", "");
  const n =
    h.length === 3
      ? parseInt(
          h
            .split("")
            .map((c) => c + c)
            .join(""),
          16
        )
      : parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].join(" ");
};
const withAlpha = (hex: string, a: number) => `rgba(${toRGB(hex)},${a})`;

/* =======================================================================
   Tipos
   ======================================================================= */
type SvgIcon = LucideIcon;
type Stat = {
  label: string;
  value: number;
  delta?: number;
  color: keyof typeof TWC;
  icon: SvgIcon;
  spark: number[];
};

/** quitamos selector de rango => solo "total" */
type Range = "total";

/* =======================================================================
   Helpers de tema/usuario (sin any)
   ======================================================================= */
function useIsLightTheme() {
  const [light, setLight] = useState<boolean>(false);
  useEffect(() => {
    const root = document.documentElement;
    const get = () => !root.classList.contains("dark");
    setLight(get());
    const mo = new MutationObserver(() => setLight(get()));
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  return light;
}

function readCookie(name: string): string | null {
  const parts = document.cookie.split(";").map((p) => p.trim());
  for (const part of parts) {
    if (!part) continue;
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    const key = decodeURIComponent(part.slice(0, eq));
    if (key === name) return decodeURIComponent(part.slice(eq + 1));
  }
  return null;
}

function pickFromObjectString(o: unknown): string | null {
  if (o && typeof o === "object") {
    const obj = o as Record<string, unknown>;
    const cand = ["username", "login", "user", "name", "email"];
    for (const k of cand) {
      const v = obj[k];
      if (typeof v === "string" && v.trim()) return v;
    }
  }
  return null;
}

/** lee user de local/sessionStorage y cookies (incluye claves del login) */
function getUsernameFromStorage(): string | null {
  const STORAGE_KEYS = [
    "mj:user", // ⬅️ guardado por el login
    "mj_username",
    "mj_login",
    "username",
    "login",
    "user",
    "userLogin",
  ];

  for (const store of [localStorage, sessionStorage]) {
    for (const k of STORAGE_KEYS) {
      const v = store.getItem(k);
      if (!v) continue;
      try {
        const parsed = JSON.parse(v);
        const inside = pickFromObjectString(parsed);
        if (inside) return inside;
      } catch {
        if (v.trim()) return v;
      }
    }
  }

  const COOKIE_KEYS = ["mj_user", "username", "login", "user"];
  for (const k of COOKIE_KEYS) {
    const v = readCookie(k);
    if (!v) continue;
    try {
      const parsed = JSON.parse(v);
      const inside = pickFromObjectString(parsed);
      if (inside) return inside;
    } catch {
      if (v.trim()) return v;
    }
  }

  return null;
}

function useUsername() {
  const [name, setName] = useState<string>("Usuario");

  useEffect(() => {
    const refresh = () => {
      try {
        const n = getUsernameFromStorage();
        setName(n && n.trim() ? n : "Usuario");
      } catch {
        setName("Usuario");
      }
    };
    refresh();
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  return name;
}

/* =======================================================================
   IconMark helpers
   ======================================================================= */
type IconMarkVars = React.CSSProperties & {
  "--iconmark-bg"?: string;
  "--iconmark-border"?: string;
  "--iconmark-icon-fg"?: string;
  "--iconmark-hover-bg"?: string;
  "--iconmark-hover-border"?: string;
  "--iconmark-hover-icon-fg"?: string;
};

function iconMarkStyle(accent: string, isLight: boolean): IconMarkVars {
  const NEUTRAL_BG = isLight ? "#e2e5ea" : "#0b0b0d";
  const FG_ACTIVE = isLight ? "#0b0b0d" : "#ffffff";
  return {
    "--iconmark-bg": NEUTRAL_BG,
    "--iconmark-border": accent,
    "--iconmark-icon-fg": accent,
    "--iconmark-hover-bg": accent,
    "--iconmark-hover-border": accent,
    "--iconmark-hover-icon-fg": FG_ACTIVE,
  };
}

/* =======================================================================
   Hook: count-up
   ======================================================================= */
function useCountUp(value: number, duration = 700) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const from = 0;
    const to = Number(value) || 0;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(from + (to - from) * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return display;
}

/* =======================================================================
   Sparkline simple con SVG
   ======================================================================= */
function Sparkline({
  values,
  stroke = "#6366F1",
  width = 120,
  height = 36,
  strokeWidth = 2,
}: {
  values: number[];
  stroke?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
}) {
  const svgId = useId();
  if (!values.length) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const norm = (v: number) =>
    height -
    ((v - min) / (max - min || 1)) * (height - strokeWidth) -
    strokeWidth / 2;

  const step = width / (values.length - 1 || 1);
  const d = values
    .map((v, i) => `${i === 0 ? "M" : "L"} ${i * step} ${norm(v)}`)
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-[120px] h-[36px]"
      aria-hidden
    >
      <defs>
        <linearGradient id={`${svgId}-grad`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="1" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={`url(#${`${svgId}-grad`})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* =======================================================================
   Skeletons & Empty state
   ======================================================================= */
function StatSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-800/40 h-[94px] animate-pulse" />
  );
}
function BlockSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/60 dark:bg-zinc-800/40 h-[260px] animate-pulse" />
  );
}
function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 p-8 grid place-items-center text-center bg-white dark:bg-zinc-900">
      <svg
        viewBox="0 0 64 64"
        className="h-10 w-10 opacity-60 mb-2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect
          x="10"
          y="14"
          width="44"
          height="36"
          rx="6"
          className="opacity-50"
        />
        <path d="M20 28h24M20 36h14" />
      </svg>
      <p className="font-medium">{title}</p>
      {hint && (
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{hint}</p>
      )}
    </div>
  );
}

/* =======================================================================
   Tarjeta KPI (sin movimiento; hover del panel = hover del IconMark)
   ======================================================================= */
type KPIStyleVars = React.CSSProperties & { "--kpi-accent"?: string };

function StatCard({ s }: { s: Stat }) {
  const Icon = s.icon;
  const positive = (s.delta ?? 0) >= 0;
  const accent = TWC[s.color][500];
  const displayValue = useCountUp(s.value);
  const isLight = useIsLightTheme();

  return (
    <div
      className={[
        "kpi-card group relative isolate overflow-hidden rounded-2xl border",
        "bg-[#17181B] text-zinc-100 border-zinc-800",
        "transition-shadow",
        "hover:[box-shadow:0_0_0_1px_var(--kpi-accent)_inset]",
      ].join(" ")}
      style={
        {
          "--kpi-accent": accent,
          boxShadow: `inset 0 0 0 1px ${withAlpha(accent, 0.16)}`,
        } as KPIStyleVars
      }
    >
      <div className="p-4 flex items-center gap-3">
        <IconMark
          size="md"
          shape="rounded"
          borderWidth={2}
          interactive
          hoverAnim="zoom"
          style={iconMarkStyle(accent, isLight)}
          title={s.label}
          ariaLabel={s.label}
        >
          <Icon />
        </IconMark>

        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-zinc-400">
            {s.label}
          </p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-semibold">
              {displayValue.toLocaleString()}
            </h3>
            {s.delta !== undefined && (
              <span
                className={[
                  "inline-flex items-center gap-1 text-xs font-medium",
                  positive ? "text-emerald-400" : "text-rose-400",
                ].join(" ")}
                title="Variación vs. periodo anterior"
              >
                {positive ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {Math.abs(s.delta)}%
              </span>
            )}
          </div>
        </div>

        <div className="ml-auto opacity-90">
          <Sparkline values={s.spark} stroke={accent} />
        </div>
      </div>

      {/* Forzamos el hover del IconMark cuando se hace hover sobre el panel */}
      <style jsx global>{`
        .kpi-card:hover .mj-iconmark {
          --mark-bg: var(--iconmark-hover-bg, var(--iconmark-bg));
          --mark-border: var(--iconmark-hover-border, var(--iconmark-border));
          --mark-fg: var(--iconmark-hover-icon-fg, var(--iconmark-icon-fg));
        }
        .kpi-card:hover .mj-iconmark[data-anim="zoom"] .icon-default {
          opacity: var(--mark-def-opacity-hover, 1);
          transform: scale(var(--mark-def-scale-hover, 1));
        }
        .kpi-card:hover .mj-iconmark[data-anim="zoom"] .icon-hover {
          opacity: var(--mark-hov-opacity-hover, 0);
          transform: scale(var(--mark-hov-scale-hover, 1));
        }
      `}</style>
    </div>
  );
}

/* =======================================================================
   Donut con estados
   ======================================================================= */
function DonutLicenses({
  data,
}: {
  data: {
    label: string;
    value: number;
    color: string;
    status: "ok" | "warn" | "error";
  }[];
}) {
  const total = data.reduce((a, b) => a + b.value, 0) || 1;
  let acc = 0;
  const stops = data
    .map((d) => {
      const start = Math.round((acc / total) * 100);
      acc += d.value;
      const end = Math.round((acc / total) * 100);
      return `${d.color} ${start}% ${end}%`;
    })
    .join(", ");

  return (
    <div className="flex items-center gap-6">
      <div
        className="relative h-40 w-40 rounded-full"
        style={{
          background: `conic-gradient(${stops})`,
          boxShadow: "0 10px 20px rgba(0,0,0,.06)",
        }}
        aria-hidden
      >
        <div className="absolute inset-4 rounded-full bg-white dark:bg-zinc-900 border border-zinc-800" />
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="text-xs text-zinc-400">Total</p>
            <p className="text-2xl font-semibold">{total}</p>
          </div>
        </div>
      </div>

      <ul className="space-y-2">
        {data.map((d) => (
          <li key={d.label} className="flex items-center gap-3">
            <span className="relative inline-grid place-items-center">
              <span
                className="absolute inline-block h-3 w-3 rounded-full animate-ping"
                style={{ background: withAlpha(d.color, 0.35) }}
              />
              <span
                className="relative h-2.5 w-2.5 rounded-full"
                style={{ background: d.color }}
              />
            </span>
            <span className="text-sm text-zinc-300">{d.label}</span>
            <span className="ml-auto text-sm font-medium">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* =======================================================================
   Actividad reciente
   ======================================================================= */
type Activity = {
  t: string;
  ts: string;
  icon: SvgIcon;
  status: "ok" | "warn" | "error";
};

const ACTIVITY_BASE: Activity[] = [
  { t: "Nuevo usuario creado", ts: "hoy 12:30", icon: Users, status: "ok" },
  {
    t: "Cliente ACME actualizado",
    ts: "ayer 18:10",
    icon: Building2,
    status: "warn",
  },
  {
    t: "Se emitió una licencia",
    ts: "ayer 10:02",
    icon: BadgeCheck,
    status: "ok",
  },
  {
    t: "App CloudSync desplegada",
    ts: "mar 16:45",
    icon: AppWindow,
    status: "ok",
  },
];

/* =======================================================================
   Dataset (solo total)
   ======================================================================= */
const DATA_BY_RANGE: Record<
  Range,
  {
    stats: Stat[];
    donut: {
      label: string;
      value: number;
      color: string;
      status: "ok" | "warn" | "error";
    }[];
    activity: Activity[];
  }
> = {
  total: {
    stats: [
      {
        label: "Usuarios",
        value: 820,
        delta: 14,
        color: "indigo",
        icon: Users,
        spark: [80, 120, 160, 200, 260, 320, 420, 520, 620, 700, 760, 820],
      },
      {
        label: "Clientes",
        value: 190,
        delta: 8,
        color: "cyan",
        icon: Building2,
        spark: [40, 55, 70, 85, 100, 115, 130, 145, 160, 170, 180, 190],
      },
      {
        label: "Aplicaciones",
        value: 32,
        delta: 5,
        color: "violet",
        icon: AppWindow,
        spark: [6, 8, 10, 12, 15, 18, 20, 22, 25, 27, 30, 32],
      },
      {
        label: "Licencias por vencer",
        value: 12,
        color: "emerald",
        icon: BadgeCheck,
        spark: [4, 5, 7, 8, 7, 9, 10, 11, 12, 11, 12, 12],
      },
    ],
    donut: [
      { label: "Activas", value: 780, color: TWC.emerald[500], status: "ok" },
      {
        label: "Próximas a expirar",
        value: 110,
        color: TWC.amber[500],
        status: "warn",
      },
      { label: "Vencidas", value: 48, color: BRAND, status: "error" },
    ],
    activity: ACTIVITY_BASE,
  },
};

/* =======================================================================
   Página
   ======================================================================= */
export default function Dashboard() {
  const [range] = useState<Range>("total");
  const [loading, setLoading] = useState(true);
  const isLight = useIsLightTheme();
  const username = useUsername();

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(t);
  }, [range]);

  const current = useMemo(() => DATA_BY_RANGE[range], [range]);

  const NO_STATS = false;
  const NO_ACTIVITY = false;

  return (
    <div className="space-y-8 md:space-y-10">
      <header className="pt-2 md:pt-4">
        <div>
          <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 mb-2 md:mb-3">
            Bienvenido, <span className="font-medium">{username}</span>
          </p>

          <Heading
            level={1}
            fill="solid"
            color="var(--brand, #8E2434)"
            fontFamily="var(--font-display, Sora, ui-sans-serif)"
            shadow="soft+brand"
            size="clamp(1.6rem,3.2vw,2.4rem)"
            className="mt-2 md:mt-3 uppercase tracking-widest"
          >
            Dashboard
          </Heading>

          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-3 md:mt-4">
            Resumen general (datos de ejemplo).
          </p>
        </div>
      </header>

      {/* KPIs */}
      {loading ? (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
          <StatSkeleton />
        </div>
      ) : NO_STATS || current.stats.length === 0 ? (
        <EmptyState
          title="Sin estadísticas"
          hint="No hay datos para el rango seleccionado."
        />
      ) : (
        <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
          {current.stats.map((s) => (
            <StatCard key={s.label} s={s} />
          ))}
        </div>
      )}

      {/* Segunda fila: Donut + Actividad */}
      <div className="grid gap-4 md:grid-cols-2">
        {loading ? (
          <>
            <BlockSkeleton />
            <BlockSkeleton />
          </>
        ) : (
          <>
            <section className="rounded-2xl border bg-[#17181B] text-zinc-100 border-zinc-800 p-5">
              <h2 className="text-base font-semibold">Licencias — estado</h2>
              <p className="text-xs text-zinc-400 mb-4">Distribución actual.</p>
              <DonutLicenses data={current.donut} />
            </section>

            <section className="relative rounded-2xl border bg-[#17181B] text-zinc-100 border-zinc-800 p-5">
              <h2 className="text-base font-semibold">Actividad reciente</h2>

              {NO_ACTIVITY || current.activity.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    title="Sin actividad"
                    hint="Todavía no hay eventos para este periodo."
                  />
                </div>
              ) : (
                <ul className="mt-3 divide-y divide-zinc-800">
                  {current.activity.map((a, i) => {
                    const Ico = a.icon;
                    const color =
                      a.status === "ok"
                        ? TWC.emerald[500]
                        : a.status === "warn"
                        ? TWC.amber[500]
                        : BRAND;
                    return (
                      <li key={i} className="py-3 flex items-center gap-3">
                        <span className="relative inline-grid place-items-center">
                          <IconMark
                            size="sm"
                            shape="rounded"
                            borderWidth={2}
                            interactive
                            hoverAnim="zoom"
                            style={iconMarkStyle(color, isLight)}
                            ariaLabel={a.t}
                            title={a.t}
                          >
                            <Ico />
                          </IconMark>

                          <span className="absolute -top-1 -right-1 inline-grid place-items-center">
                            <span
                              className="absolute h-3 w-3 rounded-full animate-ping"
                              style={{ background: withAlpha(color, 0.35) }}
                            />
                            <span
                              className="relative h-2 w-2 rounded-full"
                              style={{ background: color }}
                            />
                          </span>
                        </span>

                        <div className="min-w-0">
                          <p className="text-sm">{a.t}</p>
                          <p className="text-xs text-zinc-400">{a.ts}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          </>
        )}
      </div>

      {!loading && (
        <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <Clock8 className="h-4 w-4" />
          Actualizado hace 2 min
        </div>
      )}
    </div>
  );
}
