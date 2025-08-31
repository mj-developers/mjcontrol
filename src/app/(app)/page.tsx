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

/* ===== util colores ===== */
const TWC = {
  indigo: { 500: "#6366F1" },
  cyan: { 500: "#06B6D4" },
  violet: { 500: "#8B5CF6" },
  emerald: { 500: "#10B981" },
  amber: { 500: "#F59E0B" },
  rose: { 500: "#E11D48" },
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

/* ===== tipos ===== */
type SvgIcon = LucideIcon;
type Stat = {
  label: string;
  value: number;
  delta?: number;
  color: keyof typeof TWC;
  icon: SvgIcon;
  spark: number[];
};
type Range = "total" | "7d" | "30d" | "90d";

/* ===== tema + username ===== */
function useIsLightTheme() {
  const [l, setL] = useState(false);
  useEffect(() => {
    const r = document.documentElement;
    const g = () => !r.classList.contains("dark");
    setL(g());
    const mo = new MutationObserver(() => setL(g()));
    mo.observe(r, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  return l;
}
function readCookie(name: string) {
  const parts = document.cookie.split(";").map((p) => p.trim());
  for (const part of parts) {
    const i = part.indexOf("=");
    if (i < 0) continue;
    const k = decodeURIComponent(part.slice(0, i));
    if (k === name) return decodeURIComponent(part.slice(i + 1));
  }
  return null;
}
function pickFromObjectString(o: unknown) {
  if (o && typeof o === "object") {
    const obj = o as Record<string, unknown>;
    for (const k of [
      "username",
      "login",
      "user",
      "name",
      "email",
      "unique_name",
    ]) {
      const v = obj[k];
      if (typeof v === "string" && v.trim()) return v;
    }
  }
  return null;
}
function tryUsernameFromAnyJWT() {
  const cookies = document.cookie.split(";").map((p) => p.trim());
  for (const c of cookies) {
    const i = c.indexOf("=");
    if (i < 0) continue;
    const val = decodeURIComponent(c.slice(i + 1));
    if (!/^[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+$/.test(val))
      continue;
    const payload = val.split(".")[1];
    try {
      const json = JSON.parse(
        decodeURIComponent(
          atob(payload.replace(/-/g, "+").replace(/_/g, "/"))
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        )
      );
      const maybe = pickFromObjectString(json);
      if (maybe) return maybe;
    } catch {}
  }
  return null;
}
function getUsernameFromStorage() {
  const keys = [
    "mj_username",
    "mj_login",
    "mj_user",
    "mj:user",
    "username",
    "login",
    "user",
    "userLogin",
  ];
  for (const store of [localStorage, sessionStorage]) {
    for (const k of keys) {
      const v = store.getItem(k);
      if (!v) continue;
      try {
        const parsed = JSON.parse(v);
        const inside = pickFromObjectString(parsed);
        if (inside) return inside;
      } catch {
        if (String(v).trim()) return v;
      }
    }
  }
  for (const k of keys) {
    const v = readCookie(k);
    if (!v) continue;
    try {
      const parsed = JSON.parse(v);
      const inside = pickFromObjectString(parsed);
      if (inside) return inside;
    } catch {
      if (String(v).trim()) return v;
    }
  }
  return tryUsernameFromAnyJWT();
}
function useUsername() {
  const [n, setN] = useState<string>("Usuario");
  useEffect(() => {
    try {
      const v = getUsernameFromStorage();
      if (v && v.trim()) setN(v);
    } catch {}
  }, []);
  return n;
}

/* ===== IconMark helpers ===== */
type IconMarkVars = React.CSSProperties & {
  "--iconmark-bg"?: string;
  "--iconmark-border"?: string;
  "--iconmark-icon-fg"?: string;
  "--iconmark-hover-bg"?: string;
  "--iconmark-hover-border"?: string;
  "--iconmark-hover-icon-fg"?: string;
};
function iconMarkStyle(accent: string, isLight: boolean): IconMarkVars {
  const NEUTRAL_BG = isLight ? "#e2e5ea" : "#0d1117";
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

/* ===== Surface (relleno total) ===== */
function Surface({
  children,
  className = "",
  flat = false,
}: {
  children?: React.ReactNode;
  className?: string;
  flat?: boolean;
}) {
  return (
    <div
      className={[
        "relative rounded-[var(--panel-radius,12px)] p-[1.25px]",
        "shadow-[0_0_0_1px_var(--panel-outline,rgba(0,0,0,.06))]",
        "h-full flex",
      ].join(" ")}
      style={{
        background: flat
          ? "transparent"
          : "linear-gradient(180deg, rgba(0,0,0,.06), rgba(0,0,0,0))",
      }}
    >
      <div
        className={[
          "rounded-[inherit] border backdrop-blur-[var(--panel-blur,8px)]",
          "bg-[var(--panel-bg)] text-[var(--panel-fg)] border-[var(--panel-border)]",
          "relative overflow-hidden",
          "flex-1",
          className,
        ].join(" ")}
      >
        {!flat && (
          <>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "var(--panel-glass-bg,linear-gradient(180deg,rgba(255,255,255,.06),rgba(255,255,255,0)))",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                boxShadow:
                  "inset 0 0 120px var(--panel-vignette-color,transparent)",
              }}
            />
          </>
        )}
        <div className="relative h-full flex flex-col">{children}</div>
      </div>
    </div>
  );
}

/* ===== anim counter ===== */
function useCountUp(value: number, duration = 700) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const to = Number(value) || 0;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(to * eased));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return display;
}

/* ===== sparkline ===== */
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

/* ===== skeletons / empty ===== */
const StatSkeleton = () => <Surface className="h-[94px] animate-pulse" flat />;
const BlockSkeleton = () => (
  <Surface className="h-[260px] animate-pulse" flat />
);
function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <Surface className="p-8 grid place-items-center text-center" flat>
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
      {hint && <p className="text-xs text-[var(--muted-fg)] mt-1">{hint}</p>}
    </Surface>
  );
}

/* ===== KPI card ===== */
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
        "kpi-card group relative isolate overflow-hidden rounded-[var(--panel-radius,12px)] border",
        "bg-[var(--panel-bg)] text-[var(--panel-fg)] border-[var(--panel-border)]",
        "transition-shadow",
        "hover:[box-shadow:0_0_0_1px_var(--kpi-accent)_inset]",
        "h-full",
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
          <p className="text-xs uppercase tracking-wide muted">{s.label}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-semibold">
              {displayValue.toLocaleString()}
            </h3>
            {"delta" in s && s.delta !== undefined && (
              <span
                className={[
                  "inline-flex items-center gap-1 text-xs font-medium",
                  positive ? "text-emerald-500" : "text-rose-500",
                ].join(" ")}
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

      <style jsx global>{`
        .kpi-card:hover .mj-iconmark {
          --mark-bg: var(--iconmark-hover-bg, var(--iconmark-bg));
          --mark-border: var(--iconmark-hover-border, var(--iconmark-border));
          --mark-fg: var(--iconmark-hover-icon-fg, var(--iconmark-icon-fg));
        }
        .muted {
          color: var(--fg);
          opacity: 0.76;
        }
      `}</style>
    </div>
  );
}

/* ===== Donut ===== */
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
        <div className="absolute inset-4 rounded-full bg-[var(--panel-bg)] border border-[var(--panel-border)]" />
        <div className="absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="text-xs text-[var(--muted-fg)]">Total</p>
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
            <span className="text-sm text-[var(--fg)]/80">{d.label}</span>
            <span className="ml-auto text-sm font-medium">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ===== actividad ===== */
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

/* ===== dataset ===== */
type RangeData = {
  stats: Stat[];
  donut: {
    label: string;
    value: number;
    color: string;
    status: "ok" | "warn" | "error";
  }[];
  activity: Activity[];
};
const EMPTY_DATA: RangeData = { stats: [], donut: [], activity: ACTIVITY_BASE };
const DATA_BY_RANGE: Record<Range, RangeData> = {
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
  "7d": { ...EMPTY_DATA },
  "30d": { ...EMPTY_DATA },
  "90d": { ...EMPTY_DATA },
};

/* ===== página ===== */
export default function Dashboard() {
  const [range] = useState<Range>("total");
  const [loading] = useState(false);
  const isLight = useIsLightTheme();
  const username = useUsername();
  const current = useMemo(() => DATA_BY_RANGE[range], [range]);

  // === Gateo como en Users para evitar flash del nav en el primer frame ===
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(id);
  }, []);
  if (!mounted) return <div className="p-4 md:p-6" />;

  return (
    <div className="space-y-8 md:space-y-10 dashboard-scope">
      <style jsx global>{`
        .dashboard-scope {
          font-family: var(--font-body, Sora, ui-sans-serif);
        }
        .dashboard-scope .muted {
          color: var(--fg);
          opacity: 0.76;
        }
      `}</style>

      <header className="pt-2 md:pt-4">
        <div>
          <p className="text-xs md:text-sm muted mb-2 md:mb-3">
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

          <p className="text-sm muted mt-3 md:mt-4">
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
      ) : current.stats.length === 0 ? (
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

      {/* Segunda fila – misma altura y relleno completo */}
      <div className="grid gap-4 md:grid-cols-2 items-stretch min-h-0">
        {loading ? (
          <>
            <BlockSkeleton />
            <BlockSkeleton />
          </>
        ) : (
          <>
            <Surface className="p-5 min-h-0" flat>
              <h2 className="text-base font-semibold">Licencias — estado</h2>
              <p className="text-xs muted mb-4">Distribución actual.</p>
              <DonutLicenses data={current.donut} />
            </Surface>

            <Surface className="p-5 min-h-0" flat>
              <h2 className="text-base font-semibold">Actividad reciente</h2>
              {current.activity.length === 0 ? (
                <div className="mt-4">
                  <EmptyState
                    title="Sin actividad"
                    hint="Todavía no hay eventos para este periodo."
                  />
                </div>
              ) : (
                <ul className="mt-3 divide-y divide-[var(--border)]/60">
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
                          <p className="text-xs muted">{a.ts}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Surface>
          </>
        )}
      </div>

      <div className="hidden md:flex items-center gap-2 text-xs muted">
        <Clock8 className="h-4 w-4" />
        Actualizado hace 2 min
      </div>
    </div>
  );
}
