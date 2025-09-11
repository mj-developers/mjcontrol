/* eslint-disable @next/next/no-img-element */
"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  MoreHorizontal,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Save,
  Trash2,
  X,
  Check,
  AppWindow, // Icono para "Nueva aplicación"
} from "lucide-react";
import Heading from "@/components/ui/Heading";
import IconMark from "@/components/ui/IconMark";
import { getInitialTheme, type Theme } from "@/lib/theme";

/* --------------------------- Tema reactivo --------------------------- */
function useReactiveTheme(): Theme {
  const [theme, setTheme] = useState<Theme>(getInitialTheme());
  useEffect(() => {
    const root = document.documentElement;
    const compute = () =>
      (root.classList.contains("dark") ? "dark" : "light") as Theme;
    setTheme(compute());
    const mo = new MutationObserver(() => setTheme(compute()));
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, []);
  return theme;
}

/* --------------------------- Tipos & helpers --------------------------- */

type AccentVars = React.CSSProperties & { ["--accent"]?: string };
type MarkVars = React.CSSProperties & {
  ["--iconmark-bg"]?: string;
  ["--iconmark-border"]?: string;
  ["--iconmark-fg"]?: string;
  ["--iconmark-hover-bg"]?: string;
  ["--iconmark-hover-border"]?: string;
  ["--iconmark-hover-fg"]?: string;
};
type WithToolbarVars = React.CSSProperties & {
  ["--btn-ik-accent"]?: string;
  ["--btn-ik-text"]?: string;
};

type ApplicationListItem = {
  id: number;
  code: string;
  name: string;
  statusId: number | null;
  minVersion?: string;
  licenseDays?: number;
  createdAt?: string;
};

type ApplicationInfo = {
  id: number;
  code: string;
  name: string;
  statusId: number | null;
  statusCode?: string;
  statusName?: string;
  minVersion?: string;
  licenseDays?: number;
  createdAt?: string;
};

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
async function fetchJSONSafe<T = unknown>(res: Response): Promise<T | null> {
  try {
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
function pickNum(u: unknown, fb = 0): number {
  if (typeof u === "number" && Number.isFinite(u)) return u;
  const n = Number(u ?? NaN);
  return Number.isFinite(n) ? n : fb;
}
function pickStr(u: unknown): string {
  return typeof u === "string" ? u : String(u ?? "").trim();
}

/* ------------------------------ API ------------------------------ */

async function listApplications(): Promise<ApplicationListItem[]> {
  const res = await fetch("/api/applications/list", { cache: "no-store" });
  const json = await fetchJSONSafe<unknown>(res);
  if (!res.ok || !Array.isArray(json)) return [];

  const out: ApplicationListItem[] = [];
  for (const it of json) {
    if (!isObj(it)) continue;
    const o = it as Record<string, unknown>;
    const id = pickNum(o.id, NaN);
    const code = pickStr(o.code);
    const name = pickStr(o.name);
    const statusId = isObj(o.status)
      ? pickNum(
          (o.status as Record<string, unknown>).id,
          null as unknown as number
        )
      : pickNum(o.status_id as unknown, null as unknown as number);
    const minVersion = pickStr(o.min_version);
    const licenseDaysRaw = o.license_duration_days;
    const licenseDays =
      typeof licenseDaysRaw === "number"
        ? licenseDaysRaw
        : Number.isFinite(Number(licenseDaysRaw ?? NaN))
        ? Number(licenseDaysRaw)
        : undefined;

    const createdAt = pickStr(o.created_at);
    if (Number.isFinite(id) && code && name) {
      out.push({
        id,
        code,
        name,
        statusId: Number.isFinite(statusId) ? statusId : null,
        minVersion: minVersion || undefined,
        licenseDays,
        createdAt: createdAt || undefined,
      });
    }
  }
  return out;
}

async function getApplication(id: number): Promise<ApplicationInfo> {
  const res = await fetch(
    `/api/applications/getApplication/${encodeURIComponent(id)}`,
    { cache: "no-store" }
  );
  const json = await fetchJSONSafe<unknown>(res);
  if (!res.ok || !isObj(json)) {
    return {
      id,
      code: "",
      name: "",
      statusId: null,
    };
  }
  const r = json as Record<string, unknown>;
  const status = isObj(r.status) ? (r.status as Record<string, unknown>) : null;

  return {
    id: pickNum(r.id, id),
    code: pickStr(r.code),
    name: pickStr(r.name),
    statusId: status
      ? pickNum(status.id, null as unknown as number)
      : pickNum(r.status_id, null as unknown as number),
    statusCode: status ? pickStr(status.code) || undefined : undefined,
    statusName: status ? pickStr(status.name) || undefined : undefined,
    minVersion: pickStr(r.min_version) || undefined,
    licenseDays:
      typeof r.license_duration_days === "number"
        ? r.license_duration_days
        : Number.isFinite(Number(r.license_duration_days ?? NaN))
        ? Number(r.license_duration_days)
        : undefined,
    createdAt: pickStr(r.created_at) || undefined,
  };
}

type CreatePayload = {
  code: string;
  name: string;
  statusId?: number | null;
  minVersion?: string;
  licenseDays?: number;
};

async function createApplication(
  payload: CreatePayload
): Promise<number | null> {
  // 1) create (solo Code/Name, según backend)
  const res = await fetch("/api/applications/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ Code: payload.code, Name: payload.name }),
  });
  const json = await fetchJSONSafe<unknown>(res);

  if (!res.ok) {
    const msg =
      (isObj(json) && typeof (json as { error?: unknown }).error === "string"
        ? (json as { error: string }).error
        : null) ?? "Error creando aplicación";
    throw new Error(msg);
  }

  // intentar sacar ID de distintas formas
  let newId: number | null = null;
  if (typeof json === "number") newId = json;
  else if (isObj(json)) {
    const o = json as Record<string, unknown>;
    const candidates = [
      o.id,
      o.ID,
      o.appId,
      o.ApplicationId,
      isObj(o.data) ? (o.data as Record<string, unknown>).id : undefined,
      isObj(o.app) ? (o.app as Record<string, unknown>).id : undefined,
    ];
    for (const c of candidates) {
      const n = pickNum(c, NaN);
      if (Number.isFinite(n)) {
        newId = n;
        break;
      }
    }
  }

  // 2) update opcional con status/minVersion/licenceDays
  if (
    Number.isFinite(newId) &&
    (payload.statusId != null ||
      (payload.minVersion && payload.minVersion.trim()) ||
      Number.isFinite(payload.licenseDays))
  ) {
    const body: Record<string, unknown> = {};
    if (payload.statusId != null) body.status_id = payload.statusId;
    if (payload.minVersion) body.min_version = payload.minVersion;
    if (Number.isFinite(payload.licenseDays))
      body.license_duration_days = payload.licenseDays;
    await fetch(`/api/applications/update/${encodeURIComponent(newId!)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => void 0);
  }

  return newId;
}

async function updateApplication(
  id: number,
  payload: Partial<CreatePayload>
): Promise<void> {
  const body: Record<string, unknown> = {};
  if (payload.code != null) body.code = payload.code;
  if (payload.name != null) body.name = payload.name;
  if (payload.statusId != null) body.status_id = payload.statusId;
  if (payload.minVersion != null) body.min_version = payload.minVersion;
  if (payload.licenseDays != null)
    body.license_duration_days = payload.licenseDays;

  const res = await fetch(
    `/api/applications/update/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
  if (!res.ok) {
    const j = await fetchJSONSafe<{ error?: string }>(res);
    throw new Error(j?.error ?? `Error actualizando aplicación ${id}`);
  }
}

async function deleteApplication(id: number): Promise<void> {
  const res = await fetch(
    `/api/applications/delete/${encodeURIComponent(id)}`,
    {
      method: "DELETE",
    }
  );
  if (!res.ok && res.status !== 204) {
    const j = await fetchJSONSafe<{ error?: string }>(res);
    throw new Error(j?.error ?? `Error eliminando aplicación ${id}`);
  }
}

/* ---------------------------- Utils layout ---------------------------- */

function useAppContentInnerHeight(safety = 8) {
  const [h, setH] = useState<number | null>(null);
  useEffect(() => {
    const recompute = () => {
      const app = document.querySelector(
        ".app-shell .app-content"
      ) as HTMLElement | null;
      const vh = window.innerHeight;
      let pt = 0,
        pb = 0;
      if (app) {
        const cs = getComputedStyle(app);
        pt = parseFloat(cs.paddingTop) || 0;
        pb = parseFloat(cs.paddingBottom) || 0;
      }
      setH(Math.max(0, vh - pt - pb - safety));
    };
    recompute();
    window.addEventListener("resize", recompute);
    return () => window.removeEventListener("resize", recompute);
  }, [safety]);
  return h;
}

type PageToken = number | "...";
function buildPageItems(current: number, total: number): PageToken[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  const first = 1;
  const last = total;
  const left = Math.max(2, current - 2);
  const right = Math.min(last - 1, current + 2);
  const items: PageToken[] = [first];
  if (left > 2) items.push("...");
  for (let p = left; p <= right; p++) items.push(p);
  if (right < last - 1) items.push("...");
  items.push(last);
  return items;
}

/* ================================= Page ================================= */

export default function ApplicationsPage() {
  const theme = useReactiveTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const availH = useAppContentInnerHeight(10);

  // Colores
  const ACCENT = "#8B5CF6"; // violeta apps
  const ACC_ACTIONS = "#6366F1"; // como en Users
  const subtleText = theme === "light" ? "text-zinc-600" : "text-zinc-400";
  const shellTone =
    theme === "light"
      ? "bg-white border-zinc-300"
      : "bg-[#0D1117] border-zinc-700";
  const headerTone =
    theme === "light"
      ? "bg-[#E7EBF1]/95 border-zinc-300"
      : "bg-[#131821]/95 border-zinc-700";

  const NORMAL_BORDER = theme === "light" ? "#0e1117" : "#ffffff";
  const NORMAL_BG = theme === "light" ? "#e2e5ea" : "#0b0b0d";
  const FG_NORMAL = theme === "light" ? "#010409" : "#ffffff";

  const iconMarkBase: MarkVars = {
    ["--iconmark-bg"]: NORMAL_BG,
    ["--iconmark-border"]: NORMAL_BORDER,
    ["--iconmark-fg"]: FG_NORMAL,
    ["--iconmark-hover-bg"]: ACCENT,
    ["--iconmark-hover-border"]: ACCENT,
    ["--iconmark-hover-fg"]: "#ffffff",
  };

  // Estado
  const [search, setSearch] = useState("");
  const [list, setList] = useState<ApplicationListItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Paginación simple
  const [pageSize, setPageSize] = useState<number>(25);
  const [page, setPage] = useState<number>(1);

  // Acciones dropdown
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsBtnRef = useRef<HTMLButtonElement | null>(null);

  // Modales
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  // Carga
  useEffect(() => {
    if (!mounted) return;
    (async () => {
      setLoading(true);
      try {
        const data = await listApplications();

        // DEMO: añade placeholders para ver varias tarjetas
        const placeholders: ApplicationListItem[] = Array.from(
          { length: 8 },
          (_, i) => ({
            id: 10000 + i,
            code: `PH${i + 1}`,
            name: `Placeholder ${i + 1}`,
            statusId: null,
            minVersion: "1.0.0",
          })
        );
        setList([...data, ...placeholders]);
      } finally {
        setLoading(false);
      }
    })();
  }, [mounted]);

  // Filtro
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (a) =>
        a.name.toLowerCase().includes(q) || a.code.toLowerCase().includes(q)
    );
  }, [search, list]);

  // Paginación
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filtered.length / pageSize)),
    [filtered.length, pageSize]
  );
  const displayed = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  // Cerrar acciones al click fuera
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!actionsOpen) return;
      const target = e.target as Node;
      if (
        actionsBtnRef.current &&
        !actionsBtnRef.current.contains(target) &&
        !(
          document.getElementById("apps-actions-menu")?.contains(target) ??
          false
        )
      ) {
        setActionsOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [actionsOpen]);

  if (!mounted) return <div className="p-6" />;

  return (
    <div
      className="apps-scope flex flex-col overflow-hidden p-4 md:p-6"
      style={
        { ["--accent"]: ACCENT, height: availH ?? undefined } as AccentVars
      }
    >
      {/* ===== estilos ===== */}
      <style jsx global>{`
        .apps-scope {
          font-family: var(--font-heading, Sora, ui-sans-serif);
          padding-bottom: 16px;
        }
        .apps-scope input,
        .apps-scope button,
        .apps-scope textarea,
        .apps-scope select {
          font: inherit;
        }

        /* ===== Toolbar ===== */
        .toolbar {
          flex-wrap: wrap;
        }
        .tb-new {
          display: inline-flex;
        }
        .only-compact {
          display: none;
        }
        .btn-label {
          display: inline;
        }
        .btn-ik {
          cursor: pointer;
          transition: border-color 0.15s, color 0.15s, background-color 0.15s;
        }
        .btn-ik:hover {
          color: var(--btn-ik-text, inherit);
          border-color: var(--btn-ik-accent, currentColor);
        }
        .btn-ik:hover .mj-iconmark {
          --iconmark-bg: var(--btn-ik-accent) !important;
          --iconmark-border: var(--btn-ik-accent) !important;
          --iconmark-fg: #fff !important;
        }

        /* === Espacio inferior por breakpoint (como en Users) === */
        @media (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {
          .apps-scope {
            padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 32px);
          }
        }
        @media (max-width: 1024px) and (orientation: landscape) {
          .apps-scope {
            padding-top: 0px;
            padding-bottom: 0px;
          }
        }
        @media (max-width: 640px) and (orientation: portrait) {
          .apps-scope {
            padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 64px);
          }
        }

        /* ===== Grid de aplicaciones ===== */
        .apps-scope .apps-grid {
          display: grid;
          gap: 0.9rem;
          grid-template-columns: 1fr; /* móvil portrait: 1 por fila */
        }

        /* móvil landscape: 2 por fila */
        @media (orientation: landscape) and (max-width: 640px) {
          .apps-scope .apps-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        /* tablet portrait: 4 por fila */
        @media (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {
          .apps-scope .apps-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }

        /* tablet landscape: 5 por fila */
        @media (max-width: 1024px) and (orientation: landscape) and (min-height: 481px) {
          .apps-scope .apps-grid {
            grid-template-columns: repeat(5, minmax(0, 1fr));
          }
        }

        /* desktop escalado */
        @media (min-width: 1025px) {
          .apps-scope .apps-grid {
            grid-template-columns: repeat(6, minmax(0, 1fr));
          }
        }
        @media (min-width: 1536px) {
          .apps-scope .apps-grid {
            grid-template-columns: repeat(7, minmax(0, 1fr));
          }
        }

        /* Tarjeta de app (hover anim + tamaño) */
        .apps-scope .app-card {
          transition: transform 180ms ease, box-shadow 180ms ease,
            background-color 180ms ease, border-color 180ms ease;
          will-change: transform;
          cursor: pointer;
        }
        .apps-scope .app-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 10px 26px rgba(139, 92, 246, 0.25);
          border-color: var(--accent);
          background: linear-gradient(
              0deg,
              rgba(139, 92, 246, 0.06),
              rgba(139, 92, 246, 0.06)
            ),
            inherit;
        }

        .apps-scope .app-logo {
          transition: transform 260ms ease;
          transform-origin: center;
          will-change: transform;
        }
        .apps-scope .app-card:hover .app-logo {
          transform: scale(1.25) rotate(12deg);
        }

        /* ===== Compactaciones (como Users) ===== */
        @media (max-width: 1024px) and (orientation: landscape),
          (max-width: 640px) and (orientation: portrait),
          (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {
          .tb-new {
            display: none !important; /* ocultar botón suelto en compactos */
          }
          .only-compact {
            display: flex !important; /* mostrar “Nueva aplicación” dentro del menú */
          }
          .btn-compact .btn-label {
            display: none; /* solo icono en acciones */
          }
        }

        /* ocultar descripción en móviles (portrait y landscape) */
        @media (max-width: 640px),
          (max-width: 800px) and (orientation: landscape) {
          .apps-scope .hide-on-compact {
            display: none !important;
          }
        }
      `}</style>

      {/* Header */}
      <header className="mb-4 md:mb-6">
        <Heading
          level={1}
          fill="solid"
          color="var(--accent, var(--brand, #8E2434))"
          fontFamily="var(--font-display, Sora, ui-sans-serif)"
          shadow="soft+brand"
          size="clamp(1.6rem,3.2vw,2.4rem)"
          className="uppercase tracking-widest"
        >
          Aplicaciones
        </Heading>

        {/* oculta en móviles */}
        <p className={`mt-3 text-sm ${subtleText} hide-on-compact`}>
          Gestiona el catálogo de aplicaciones: crea nuevas, consulta su estado
          y controla versión mínima y duración de licencia.
        </p>
      </header>

      {/* ===== Toolbar ===== */}
      <section
        className={[
          "rounded-2xl border shadow-sm mb-3",
          shellTone,
          "px-3 md:px-4 py-3",
        ].join(" ")}
      >
        <div className="toolbar flex items-center gap-2 sm:gap-3">
          {/* Buscador */}
          <div className="relative flex-1 min-w-[180px] sm:min-w-[240px]">
            <input
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearch(e.target.value)
              }
              placeholder="Buscar aplicación…"
              className={[
                "w-full h-9 rounded-xl pl-9 pr-3 border outline-none text-sm",
                theme === "light"
                  ? "bg-[#F6F8FA] border-zinc-300 text-zinc-900 placeholder-zinc-500"
                  : "bg-[#0D1117] border-zinc-700 text-white placeholder-zinc-400",
                "focus:ring-2 focus:ring-[var(--brand,#8E2434)]/30",
              ].join(" ")}
            />
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2"
              size={16}
            />
          </div>

          {/* Acciones */}
          <div className="relative">
            <button
              ref={actionsBtnRef}
              type="button"
              onClick={() => setActionsOpen((v) => !v)}
              className="btn-ik btn-compact inline-flex items-center gap-2 px-3 h-9 rounded-xl border"
              style={
                {
                  ["--btn-ik-accent"]: ACC_ACTIONS,
                  ["--btn-ik-text"]: ACC_ACTIONS,
                } as WithToolbarVars
              }
            >
              <IconMark
                size="xs"
                borderWidth={2}
                interactive
                hoverAnim="zoom"
                zoomScale={1.5}
                style={iconMarkBase} // <- usamos el objeto ya tipado
              >
                <MoreHorizontal />
              </IconMark>

              <span className="btn-label">Acciones</span>
              <ChevronDown size={16} />
            </button>

            {actionsOpen && (
              <div
                id="apps-actions-menu"
                className={[
                  "absolute right-0 mt-2 w-52 rounded-xl border shadow-md overflow-hidden z-30",
                  theme === "light"
                    ? "bg-white border-zinc-200"
                    : "bg-[#0D1117] border-zinc-700",
                ].join(" ")}
              >
                {/* NUEVA APLICACIÓN (solo vistas compactas) */}
                <button
                  type="button"
                  className={[
                    "only-compact btn-ik w-full flex items-center gap-2 px-3 py-2 text-left text-sm",
                    theme === "light"
                      ? "hover:bg-zinc-100"
                      : "hover:bg-zinc-800/50",
                  ].join(" ")}
                  style={
                    {
                      ["--btn-ik-accent"]: ACCENT,
                      ["--btn-ik-text"]: ACCENT,
                    } as WithToolbarVars
                  }
                  onClick={() => {
                    setActionsOpen(false);
                    setCreateOpen(true);
                  }}
                >
                  <IconMark
                    size="xs"
                    borderWidth={2}
                    interactive
                    hoverAnim="zoom"
                    zoomScale={1.5}
                    style={iconMarkBase}
                  >
                    <AppWindow />
                  </IconMark>
                  Nueva aplicación
                </button>

                {["Acción 1", "Acción 2"].map((label) => (
                  <button
                    key={label}
                    type="button"
                    className={[
                      "btn-ik w-full flex items-center gap-2 px-3 py-2 text-left text-sm",
                      theme === "light"
                        ? "hover:bg-zinc-100"
                        : "hover:bg-zinc-800/50",
                    ].join(" ")}
                    style={
                      {
                        ["--btn-ik-accent"]: ACC_ACTIONS,
                        ["--btn-ik-text"]: ACC_ACTIONS,
                      } as WithToolbarVars
                    }
                    onClick={() => setActionsOpen(false)}
                  >
                    <IconMark
                      size="xs"
                      borderWidth={2}
                      interactive
                      hoverAnim="zoom"
                      zoomScale={1.5}
                      style={iconMarkBase}
                    >
                      <MoreHorizontal />
                    </IconMark>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botón suelto "Nueva aplicación" (oculto en compactos) */}
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="tb-new btn-ik inline-flex items-center gap-2 px-3 h-9 rounded-xl border"
            style={
              {
                ["--btn-ik-accent"]: ACCENT,
                ["--btn-ik-text"]: ACCENT,
              } as WithToolbarVars
            }
          >
            <IconMark
              size="xs"
              borderWidth={2}
              interactive
              hoverAnim="zoom"
              zoomScale={1.5}
              style={iconMarkBase}
            >
              <AppWindow />
            </IconMark>
            Nueva aplicación
          </button>
        </div>
      </section>

      {/* ===== Grid de aplicaciones ===== */}
      <section
        className={[
          "rounded-2xl border shadow-sm",
          shellTone,
          "overflow-hidden flex-1 min-h-0 flex flex-col",
        ].join(" ")}
      >
        {/* Cabecera */}
        <div className={["px-4 py-2 border-b", headerTone].join(" ")}>
          <div className="text-xs font-semibold opacity-80">
            Listado de aplicaciones
          </div>
        </div>

        {/* Contenido */}
        <div className="flex-1 min-h-0 overflow-auto p-3">
          {loading && (
            <div className="px-1 py-2 text-sm">Cargando aplicaciones…</div>
          )}
          {!loading && displayed.length === 0 && (
            <div className="px-1 py-2 text-sm opacity-70">
              No hay resultados.
            </div>
          )}

          <div className="apps-grid">
            {!loading &&
              displayed.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setDetailId(a.id)}
                  className={[
                    "app-card group w-full text-left rounded-2xl border px-4 py-4",
                    theme === "light"
                      ? "bg-white border-zinc-200 hover:border-zinc-300"
                      : "bg-[#0F141B] border-zinc-700 hover:border-zinc-600",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    {/* Logo: SIN recorte circular */}
                    <div className="w-12 h-12 grid place-items-center flex-none">
                      <img
                        className="app-logo w-12 h-12"
                        src={
                          theme === "light"
                            ? "/LogoMJDevsSinTextoLight.svg"
                            : "/LogoMJDevsSinTextoDark.svg"
                        }
                        alt="Logo aplicación"
                        draggable={false}
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="font-semibold truncate">{a.name}</div>
                      <div
                        className={["text-[12.5px] truncate", subtleText].join(
                          " "
                        )}
                      >
                        {a.code ? a.code : ""}
                        {a.minVersion ? ` · v${a.minVersion}` : ""}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
          </div>
        </div>

        {/* Footer: paginación + contador */}
        <div
          className={[
            "px-3 md:px-4 py-1 text-xs border-t",
            headerTone,
            theme === "light" ? "text-zinc-600" : "text-zinc-300",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-2">
            <PageSizeDropdown
              theme={theme}
              value={pageSize}
              onChange={setPageSize}
            />

            <nav className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className={[
                  "w-7 h-7 grid place-items-center rounded-full border cursor-pointer",
                  theme === "light"
                    ? "border-zinc-300 bg-white text-zinc-800"
                    : "border-zinc-700 bg-[#0D1117] text-white",
                  page <= 1 ? "opacity-40 pointer-events-none" : "",
                ].join(" ")}
              >
                <ChevronLeft size={14} />
              </button>

              {buildPageItems(page, totalPages).map((it, idx) =>
                it === "..." ? (
                  <span
                    key={`dots-${idx}`}
                    className={[
                      "w-7 h-7 grid place-items-center rounded-full",
                      theme === "light" ? "text-zinc-500" : "text-zinc-400",
                    ].join(" ")}
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={it}
                    type="button"
                    onClick={() => setPage(it)}
                    className={[
                      "w-7 h-7 grid place-items-center rounded-full border cursor-pointer",
                      it === page
                        ? theme === "light"
                          ? "bg-zinc-900 border-zinc-900 text-white"
                          : "bg-white border-white text-black"
                        : theme === "light"
                        ? "bg-white border-zinc-300 text-zinc-800 hover:bg-zinc-50"
                        : "bg-[#0D1117] border-zinc-700 text-zinc-200 hover:bg-[#0D1117]/80",
                    ].join(" ")}
                  >
                    {it}
                  </button>
                )
              )}

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className={[
                  "w-7 h-7 grid place-items-center rounded-full border cursor-pointer",
                  theme === "light"
                    ? "border-zinc-300 bg-white text-zinc-800"
                    : "border-zinc-700 bg-[#0D1117] text-white",
                  page >= totalPages ? "opacity-40 pointer-events-none" : "",
                ].join(" ")}
              >
                <ChevronRight size={14} />
              </button>
            </nav>

            <div>{filtered.length} aplicación(es)</div>
          </div>
        </div>
      </section>

      {/* Modales */}
      {createOpen && (
        <CreateApplicationModal
          theme={theme}
          onClose={() => setCreateOpen(false)}
          onCreated={async () => {
            setCreateOpen(false);
            const fresh = await listApplications();
            setList([
              ...fresh,
              ...Array.from({ length: 8 }, (_, i) => ({
                id: 10000 + i,
                code: `PH${i + 1}`,
                name: `Placeholder ${i + 1}`,
                statusId: null,
                minVersion: "1.0.0",
              })),
            ]);
          }}
          accent={ACCENT}
        />
      )}

      {detailId != null && (
        <ApplicationDetailDrawer
          id={detailId}
          theme={theme}
          onClose={() => setDetailId(null)}
          onDeleted={async () => {
            setDetailId(null);
            const fresh = await listApplications();
            setList(fresh);
          }}
          onSaved={async () => {
            setDetailId(null);
            const fresh = await listApplications();
            setList(fresh);
          }}
          accent={ACCENT}
        />
      )}
    </div>
  );
}

/* ---------------- Dropdown: page size ---------------- */

function PageSizeDropdown({
  theme,
  value,
  onChange,
}: {
  theme: Theme;
  value: number;
  onChange: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (ref.current && !ref.current.contains(t)) setOpen(false);
    }
  }, [open]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!open) return;
      const t = e.target as Node;
      if (ref.current && !ref.current.contains(t)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const isLight = theme === "light";
  const pillTone = isLight
    ? "bg-white border-zinc-300"
    : "bg-[#0D1117] border-zinc-700";
  const pillHover = isLight ? "hover:bg-zinc-100" : "hover:bg-[#1a2230]";
  const options = [10, 25, 50, 100];

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={[
          "inline-flex items-center gap-2 px-2 h-7 rounded-lg border text-[12.5px] font-semibold",
          pillTone,
          pillHover,
          "cursor-pointer",
        ].join(" ")}
      >
        {value} / pág.
        <ChevronDown size={14} />
      </button>

      {open && (
        <div
          className={[
            "absolute left-0 bottom-full mb-2 w-28 rounded-xl border shadow-md overflow-hidden z-40",
            isLight
              ? "bg-white border-zinc-200"
              : "bg-[#0D1117] border-zinc-700",
          ].join(" ")}
        >
          {options.map((n) => {
            const active = n === value;
            return (
              <button
                key={n}
                type="button"
                onClick={() => {
                  onChange(n);
                  setOpen(false);
                }}
                className={[
                  "w-full flex items-center gap-2 px-3 py-1.5 text-left text-[13px]",
                  isLight ? "hover:bg-zinc-100" : "hover:bg-zinc-800/50",
                  "cursor-pointer",
                ].join(" ")}
              >
                <span
                  className={[
                    "w-4 h-4 rounded-full border grid place-items-center",
                    isLight
                      ? active
                        ? "bg-zinc-900 border-zinc-900 text-white"
                        : "bg-white border-zinc-300 text-white"
                      : active
                      ? "bg-white border-white text-black"
                      : "bg-[#0D1117] border-zinc-600 text-[#0D1117]",
                  ].join(" ")}
                >
                  {active && <Check size={12} />}
                </span>
                <span className="font-semibold">{n} / pág.</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ---------------- Modal: Crear aplicación ---------------- */

function CreateApplicationModal({
  theme,
  onClose,
  onCreated,
  accent,
}: {
  theme: Theme;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
  accent: string;
}) {
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [statusId, setStatusId] = useState<number | "">("");
  const [minVersion, setMinVersion] = useState("");
  const [licenseDays, setLicenseDays] = useState<number | "">("");
  const [busy, setBusy] = useState(false);
  const isLight = theme === "light";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) return;
    setBusy(true);
    try {
      await createApplication({
        code: code.trim(),
        name: name.trim(),
        statusId: typeof statusId === "number" ? statusId : undefined,
        minVersion: minVersion.trim() || undefined,
        licenseDays: typeof licenseDays === "number" ? licenseDays : undefined,
      });
      await onCreated();
    } finally {
      setBusy(false);
    }
  };

  const markBase: MarkVars = {
    ["--iconmark-bg"]: isLight ? "#e2e5ea" : "#0b0b0d",
    ["--iconmark-border"]: isLight ? "#0e1117" : "#ffffff",
    ["--iconmark-fg"]: isLight ? "#010409" : "#ffffff",
  };

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] grid place-items-center p-4"
      onMouseDown={onClose}
    >
      <div
        className={[
          "relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden",
          isLight ? "bg-white border-zinc-300" : "bg-[#0D1117] border-zinc-700",
        ].join(" ")}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 pt-4 pb-3"
          style={{ background: accent, color: "#fff" }}
        >
          <h2 className="text-lg font-semibold">Nueva aplicación</h2>
          <button
            type="button"
            className="opacity-90 hover:opacity-100"
            onClick={onClose}
          >
            <X />
          </button>
        </div>

        <form className="px-5 pb-5 pt-4 space-y-4" onSubmit={submit}>
          <Field
            label="Código *"
            value={code}
            onChange={setCode}
            theme={theme}
          />
          <Field
            label="Nombre *"
            value={name}
            onChange={setName}
            theme={theme}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field
              label="Estado (ID)"
              value={String(statusId)}
              onChange={(v) =>
                setStatusId(
                  v.trim() === ""
                    ? ""
                    : Number.isFinite(Number(v))
                    ? Number(v)
                    : ""
                )
              }
              theme={theme}
              inputMode="numeric"
            />
            <Field
              label="Versión mínima"
              value={minVersion}
              onChange={setMinVersion}
              theme={theme}
              placeholder="1.0.0"
            />
            <Field
              label="Licencia (días)"
              value={String(licenseDays)}
              onChange={(v) =>
                setLicenseDays(
                  v.trim() === ""
                    ? ""
                    : Number.isFinite(Number(v))
                    ? Number(v)
                    : ""
                )
              }
              theme={theme}
              inputMode="numeric"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={[
                "btn-ik inline-flex items-center gap-2 px-4 h-10 rounded-xl border",
                isLight
                  ? "bg-white border-zinc-300 hover:bg-zinc-100"
                  : "bg-[#0D1117] border-zinc-700 hover:bg-zinc-800",
              ].join(" ")}
              style={
                {
                  ["--btn-ik-accent"]: "#8E2434",
                  ["--btn-ik-text"]: "#8E2434",
                } as WithToolbarVars
              }
            >
              <IconMark
                size="xs"
                borderWidth={2}
                interactive
                hoverAnim="zoom"
                zoomScale={1.5}
                style={markBase}
              >
                <X />
              </IconMark>
              Cancelar
            </button>

            <button
              type="submit"
              disabled={busy || !code.trim() || !name.trim()}
              className={[
                "btn-ik inline-flex items-center gap-2 px-4 h-10 rounded-xl border text-white",
                busy || !code.trim() || !name.trim()
                  ? "opacity-60 pointer-events-none"
                  : "",
              ].join(" ")}
              style={
                {
                  background: accent,
                  borderColor: accent,
                  ["--btn-ik-accent"]: accent,
                  ["--btn-ik-text"]: accent,
                } as WithToolbarVars
              }
            >
              <IconMark
                size="xs"
                borderWidth={2}
                interactive
                hoverAnim="zoom"
                zoomScale={1.5}
                style={markBase}
              >
                <AppWindow />
              </IconMark>
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ---------------- Drawer: Detalle aplicación ---------------- */

function ApplicationDetailDrawer({
  id,
  theme,
  onClose,
  onDeleted,
  onSaved,
  accent,
}: {
  id: number;
  theme: Theme;
  onClose: () => void;
  onDeleted: () => Promise<void> | void;
  onSaved: () => Promise<void> | void;
  accent: string;
}) {
  const [info, setInfo] = useState<ApplicationInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [enter, setEnter] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isLight = theme === "light";

  useEffect(() => {
    let alive = true;
    (async () => {
      const data = await getApplication(id);
      if (alive) setInfo(data);
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    const t = setTimeout(() => setEnter(true), 10);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!menuOpen) return;
      const t = e.target as Node;
      if (menuRef.current && !menuRef.current.contains(t)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  const panelTone = isLight
    ? "bg-white border-zinc-300"
    : "bg-[#0D1117] border-zinc-700";

  const markBase: MarkVars = {
    ["--iconmark-bg"]: isLight ? "#e2e5ea" : "#0b0b0d",
    ["--iconmark-border"]: isLight ? "#0e1117" : "#ffffff",
    ["--iconmark-fg"]: isLight ? "#010409" : "#ffffff",
  };

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!info) return;
    setBusy(true);
    try {
      await updateApplication(info.id, {
        code: info.code,
        name: info.name,
        statusId: info.statusId ?? undefined,
        minVersion: info.minVersion,
        licenseDays: info.licenseDays,
      });
      await onSaved();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!info) return;
    if (!confirm(`¿Eliminar la aplicación “${info.name}”?`)) return;
    setBusy(true);
    try {
      await deleteApplication(info.id);
      await onDeleted();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside
        className={[
          "absolute right-0 top-0 h-full w-full max-w-xl border-l shadow-2xl",
          panelTone,
          "transition-transform duration-200 ease-out",
          enter ? "translate-x-0" : "translate-x-full",
          "rounded-l-2xl overflow-hidden flex flex-col",
        ].join(" ")}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div
          className="flex items-center justify-between px-5 py-3 border-b"
          style={{ background: accent, color: "#fff" }}
        >
          <h2 className="text-lg font-semibold">Detalles de la aplicación</h2>

          <div className="flex items-center gap-2" ref={menuRef}>
            <div className="relative">
              <button
                type="button"
                aria-label="Acciones"
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded-full p-1.5 hover:bg-white/10"
                style={{ cursor: "pointer" }}
              >
                <MoreHorizontal />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl border shadow-md overflow-hidden z-30 bg-white text-black">
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      void handleDelete();
                    }}
                    className="btn-ik w-full flex items-center gap-2 px-3 py-2 text-left text-sm hover:bg-zinc-100"
                  >
                    <IconMark
                      size="xs"
                      borderWidth={2}
                      interactive
                      hoverAnim="zoom"
                      zoomScale={1.5}
                      style={markBase}
                    >
                      <Trash2 />
                    </IconMark>
                    Eliminar
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              className="rounded-full p-1.5 hover:bg-white/10"
              onClick={onClose}
              aria-label="Cerrar"
              style={{ cursor: "pointer" }}
            >
              <X />
            </button>
          </div>
        </div>

        {/* CONTENIDO */}
        <form
          id="app-detail-form"
          className="flex-1 overflow-auto px-5 pt-4 pb-24"
          onSubmit={handleSave}
        >
          {!info ? (
            <p className="opacity-80 text-sm">Cargando…</p>
          ) : (
            <div className="grid gap-3">
              <Field
                label="Código"
                value={info.code}
                onChange={(v) => setInfo({ ...info, code: v })}
                theme={theme}
              />
              <Field
                label="Nombre"
                value={info.name}
                onChange={(v) => setInfo({ ...info, name: v })}
                theme={theme}
              />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Field
                  label="Estado (ID)"
                  value={
                    info.statusId == null ? "" : String(Number(info.statusId))
                  }
                  onChange={(v) =>
                    setInfo({
                      ...info,
                      statusId:
                        v.trim() === ""
                          ? null
                          : Number.isFinite(Number(v))
                          ? Number(v)
                          : info.statusId,
                    })
                  }
                  theme={theme}
                  inputMode="numeric"
                />
                <Field
                  label="Versión mínima"
                  value={info.minVersion ?? ""}
                  onChange={(v) => setInfo({ ...info, minVersion: v })}
                  theme={theme}
                  placeholder="1.0.0"
                />
                <Field
                  label="Licencia (días)"
                  value={
                    info.licenseDays != null ? String(info.licenseDays) : ""
                  }
                  onChange={(v) =>
                    setInfo({
                      ...info,
                      licenseDays:
                        v.trim() === ""
                          ? undefined
                          : Number.isFinite(Number(v))
                          ? Number(v)
                          : info.licenseDays,
                    })
                  }
                  theme={theme}
                  inputMode="numeric"
                />
              </div>

              {info.createdAt && (
                <div className="text-xs opacity-70">
                  Creada: {info.createdAt}
                </div>
              )}
            </div>
          )}
        </form>

        <div className="absolute bottom-0 left-0 right-0 px-5 py-3 border-t bg-white">
          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              form="app-detail-form"
              disabled={busy || !info}
              className={[
                "btn-ik inline-flex items-center gap-2 px-4 h-10 rounded-xl border",
                "bg-white text-zinc-900 border-zinc-300 hover:bg-zinc-100",
                busy || !info ? "opacity-60 pointer-events-none" : "",
              ].join(" ")}
            >
              <IconMark size="xs" borderWidth={2}>
                <Save />
              </IconMark>
              Guardar
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ---------------- Campo reutilizable ---------------- */

function Field({
  label,
  value,
  onChange,
  theme,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  theme: Theme;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  const isLight = theme === "light";
  return (
    <label className="block">
      <span className="block text-sm mb-1 opacity-80">{label}</span>
      <input
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          onChange(e.target.value)
        }
        placeholder={placeholder}
        inputMode={inputMode}
        className={[
          "w-full h-11 rounded-xl px-3 border outline-none",
          isLight
            ? "bg-[#F6F8FA] border-zinc-300 text-zinc-900"
            : "bg-[#0D1117] border-zinc-700 text-white",
          "focus:ring-2 focus:ring-[var(--brand,#8E2434)]/30",
        ].join(" ")}
      />
    </label>
  );
}
