// src/app/(app)/clients/page.tsx
"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Edit3,
  MoreHorizontal,
  Trash2,
  Save,
  X,
  Check,
} from "lucide-react";
import IconMark from "@/components/ui/IconMark";
import Heading from "@/components/ui/Heading";
import { getInitialTheme, type Theme } from "@/lib/theme";

/* --------------------------- Tipos & helpers --------------------------- */

/* ⬇⬇⬇ CAMBIO: extendemos el item de lista con más campos */
type ClientListItem = {
  id: number;
  login: string;
  taxId: string;
  tradeName: string;
  email: string;
  phone: string;
};

type ClientInfo = {
  id: number;
  login: string;
  taxId: string; // Tax_id
  tradeName: string; // Trade_Name (Nombre comercial)
  legalName: string; // Legal_Name (Razón social)
  email: string;
  phone: string;
  mobile: string;
};

type WithAccentVar = React.CSSProperties & { ["--accent"]?: string };
type WithToolbarVars = React.CSSProperties & {
  ["--btn-ik-accent"]?: string;
  ["--btn-ik-text"]?: string;
  ["--mark-hover-bg"]?: string;
  ["--mark-hover-border"]?: string;
  ["--iconmark-hover-bg"]?: string;
  ["--iconmark-hover-border"]?: string;
};

/* --------------------------- Constantes de UI --------------------------- */

const CLIENTS_ACCENT = "#F59E0B"; // ámbar (igual que el icono activo del nav)
const ACC_CREATE = CLIENTS_ACCENT;
const ACC_ACTIONS = "#6366F1";

/* ---------------------------- Hook: tema vivo --------------------------- */

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

/* ---------- Hook: altura disponible (viewport - paddings del layout) ---------- */

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

/* -------- Flag: móvil en vertical (para paginación simplificada) -------- */

function useIsMobilePortrait() {
  const [isMP, setIsMP] = useState(false);
  useEffect(() => {
    const calc = () => {
      if (typeof window === "undefined") return setIsMP(false);
      const w = window.innerWidth;
      const h = window.innerHeight;
      setIsMP(w <= 480 && h >= w);
    };
    calc();
    window.addEventListener("resize", calc);
    window.addEventListener("orientationchange", calc);
    return () => {
      window.removeEventListener("resize", calc);
      window.removeEventListener("orientationchange", calc);
    };
  }, []);
  return isMP;
}

/* ========================= Helpers de parseo/JSON ========================= */

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

function pickNum(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v ?? NaN);
  return Number.isFinite(n) ? n : fallback;
}
function pickStr(v: unknown): string {
  return typeof v === "string" ? v : String(v ?? "").trim();
}

/* ============================== API CLIENTS ============================== */

/* ⬇⬇⬇ CAMBIO: parseamos más campos del listado */
async function listClients(): Promise<ClientListItem[]> {
  const res = await fetch("/api/clients/list", { cache: "no-store" });
  const json = await fetchJSONSafe<unknown>(res);

  if (!res.ok || !Array.isArray(json)) return [];

  const out: ClientListItem[] = [];
  for (const it of json) {
    if (!isObj(it)) continue;
    const o = it as Record<string, unknown>;

    const id = pickNum(o.id ?? o.ID ?? o.clientId ?? o.ClientId ?? o.uid, NaN);
    const login = pickStr(
      o.login ?? o.Login ?? o.code ?? o.Code ?? o.client_login
    );
    const taxId = pickStr(o.tax_id ?? o.Tax_id ?? o.taxId);
    const tradeName = pickStr(o.trade_Name ?? o.Trade_Name ?? o.tradeName);
    const email = pickStr(o.email ?? o.Email);
    const phone = pickStr(o.phone ?? o.Phone);

    if (Number.isFinite(id) && login)
      out.push({ id, login, taxId, tradeName, email, phone });
  }
  return out;
}

async function getClient(id: number): Promise<ClientInfo> {
  const res = await fetch(`/api/clients/getClient/${encodeURIComponent(id)}`, {
    method: "GET",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
  });

  const json = await fetchJSONSafe<unknown>(res);
  if (!res.ok || !isObj(json)) {
    // Devuelve estructura vacía si falla
    return {
      id,
      login: "",
      taxId: "",
      tradeName: "",
      legalName: "",
      email: "",
      phone: "",
      mobile: "",
    };
  }

  const r = json as Record<string, unknown>;
  const info: ClientInfo = {
    id: pickNum(r.id ?? id, id),
    login: pickStr(r.login ?? r.Login),
    taxId: pickStr(r.tax_id ?? r.Tax_id),
    tradeName: pickStr(r.trade_Name ?? r.Trade_Name),
    legalName: pickStr(r.legal_Name ?? r.Legal_Name),
    email: pickStr(r.email ?? r.Email),
    phone: pickStr(r.phone ?? r.Phone),
    mobile: pickStr(r.mobile ?? r.Mobile),
  };
  return info;
}

type CreatePayload = {
  login: string; // Login*
  taxId: string; // Tax_id*
  tradeName: string; // Trade_Name*
  legalName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
};

async function createClient(payload: CreatePayload): Promise<{ id: number }> {
  // Mapeo a las keys que espera tu backend (TitleCase y guiones bajos)
  const body = {
    Login: payload.login,
    Tax_id: payload.taxId,
    Trade_Name: payload.tradeName,
    ...(payload.legalName ? { Legal_Name: payload.legalName } : {}),
    ...(payload.email ? { Email: payload.email } : {}),
    ...(payload.phone ? { Phone: payload.phone } : {}),
    ...(payload.mobile ? { Mobile: payload.mobile } : {}),
  };

  const res = await fetch("/api/clients/create", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const json = await fetchJSONSafe<unknown>(res);

  if (!res.ok) {
    const msg =
      isObj(json) && typeof json.error === "string"
        ? json.error
        : "Error creando cliente";
    throw new Error(msg);
  }

  // Identificamos el id en varias estructuras posibles
  let id: number | null = null;
  if (typeof json === "number") {
    id = json;
  } else if (isObj(json)) {
    const r = json as Record<string, unknown>;
    const dataObj = isObj(r.data) ? (r.data as Record<string, unknown>) : null;
    const clientObj = isObj(r.client)
      ? (r.client as Record<string, unknown>)
      : null;
    const candidates = [
      r.id,
      r.ID,
      r.clientId,
      r.ClientId,
      dataObj?.id,
      clientObj?.id,
    ];
    for (const c of candidates) {
      const n = pickNum(c, NaN);
      if (Number.isFinite(n)) {
        id = n;
        break;
      }
    }
  }
  return { id: id ?? 0 };
}

async function updateClient(id: number, payload: Partial<ClientInfo>) {
  const body: Record<string, string> = {};
  if (payload.login != null) body.Login = String(payload.login);
  if (payload.taxId != null) body.Tax_id = String(payload.taxId);
  if (payload.tradeName != null) body.Trade_Name = String(payload.tradeName);
  if (payload.legalName != null) body.Legal_Name = String(payload.legalName);
  if (payload.email != null) body.Email = String(payload.email);
  if (payload.phone != null) body.Phone = String(payload.phone);
  if (payload.mobile != null) body.Mobile = String(payload.mobile);

  const res = await fetch(`/api/clients/update/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const j = await fetchJSONSafe<unknown>(res);
    const msg =
      isObj(j) && typeof j.error === "string"
        ? j.error
        : `Error actualizando cliente ${id}`;
    throw new Error(msg);
  }
}

async function deleteClient(id: number) {
  const res = await fetch(`/api/clients/delete/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) {
    const j = await fetchJSONSafe<unknown>(res);
    const msg =
      isObj(j) && typeof j.error === "string"
        ? j.error
        : `Error eliminando cliente ${id}`;
    throw new Error(msg);
  }
}

/* ============================ Util: paginación ============================ */

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

export default function ClientsPage() {
  const theme = useReactiveTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const availH = useAppContentInnerHeight(10);
  const isMobilePortrait = useIsMobilePortrait();

  // Estado
  const [search, setSearch] = useState("");
  const [list, setList] = useState<ClientListItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Paginación
  const [pageSize, setPageSize] = useState<number>(25);
  const [page, setPage] = useState<number>(1);

  // Acciones dropdown
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsBtnRef = useRef<HTMLButtonElement | null>(null);

  // Modales
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  // Cargar lista
  useEffect(() => {
    if (!mounted) return;
    (async () => {
      setLoading(true);
      try {
        const data = await listClients();
        setList(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [mounted]);

  // Filtro texto
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((u) => u.login.toLowerCase().includes(q));
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

  // Resetear página cuando cambie búsqueda o pageSize
  useEffect(() => {
    setPage(1);
  }, [search, pageSize]);

  // Cerrar Acciones al click fuera
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!actionsOpen) return;
      const target = e.target as Node;
      if (
        actionsBtnRef.current &&
        !actionsBtnRef.current.contains(target) &&
        !(
          document.getElementById("clients-actions-menu")?.contains(target) ??
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

  const subtleText = theme === "light" ? "text-zinc-500" : "text-zinc-400";
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

  const iconMarkBase = {
    ["--mark-bg"]: NORMAL_BG,
    ["--mark-border"]: NORMAL_BORDER,
    ["--mark-fg"]: FG_NORMAL,
    ["--iconmark-bg"]: NORMAL_BG,
    ["--iconmark-border"]: NORMAL_BORDER,
    ["--iconmark-fg"]: FG_NORMAL,
  } as React.CSSProperties;

  return (
    <div
      className="clients-scope flex flex-col overflow-hidden p-4 md:p-6"
      style={
        {
          ["--accent"]: CLIENTS_ACCENT,
          height: availH != null ? `${availH}px` : undefined,
        } as WithAccentVar
      }
    >
      {/* ====== estilos scope ====== */}
      <style jsx global>{`
        .clients-scope {
          font-family: var(--font-heading, Sora, ui-sans-serif);
        }
        .clients-scope input,
        .clients-scope button,
        .clients-scope textarea,
        .clients-scope select {
          font: inherit;
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
          --mark-bg: var(--btn-ik-accent) !important;
          --mark-border: var(--btn-ik-accent) !important;
          --mark-fg: #fff !important;
          --iconmark-bg: var(--btn-ik-accent) !important;
          --iconmark-border: var(--btn-ik-accent) !important;
          --iconmark-fg: #fff !important;
        }
        .btn-ik:hover .mj-iconmark[data-anim="zoom"] .icon-default {
          transform: scale(1.5) !important;
        }
        .btn-ik:hover .mj-iconmark[data-anim="zoom"] .icon-hover {
          transform: scale(1) !important;
        }

        /* ===== Toolbar base ===== */
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

        @media (min-width: 768px) {
          .toolbar {
            flex-wrap: nowrap;
          }
        }

        @media (max-width: 1024px) and (orientation: landscape) {
          .toolbar {
            flex-wrap: nowrap;
          }
          .toolbar .tb-search {
            min-width: 140px;
            flex: 1 1 140px;
          }
        }

        /* Móvil en vertical: search + acciones en la misma fila */
        @media (max-width: 640px) and (orientation: portrait) {
          .toolbar {
            flex-wrap: nowrap;
          }
          .toolbar .tb-search {
            order: 1;
            min-width: 0;
            flex: 1 1 auto;
            margin-top: 0;
          }
          .toolbar .tb-actions {
            order: 2;
            flex: 0 0 auto;
            margin-left: 0.5rem;
          }
          .btn-compact .btn-label {
            display: none;
          }
          .btn-compact {
            padding-left: 0.5rem;
            padding-right: 0.5rem;
          }
        }

        @media (min-width: 768px) and (max-width: 1024px) and (orientation: portrait),
          (max-width: 1024px) and (orientation: landscape),
          (max-width: 640px) and (orientation: portrait) {
          .tb-new {
            display: none !important;
          }
          .only-compact {
            display: flex !important;
          }
        }

        @media (max-width: 1024px) and (orientation: landscape),
          (max-width: 640px) and (orientation: portrait),
          (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {
          .hide-on-compact {
            display: none !important;
          }
        }

        /* ===== Espacio inferior por breakpoint ===== */
        .clients-scope {
          padding-bottom: 16px;
        }
        @media (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {
          .clients-scope {
            padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 32px);
          }
        }
        @media (max-width: 1024px) and (orientation: landscape) {
          .clients-scope {
            padding-top: 0px;
            padding-bottom: 0px;
          }
        }
        @media (max-width: 640px) and (orientation: portrait) {
          .clients-scope {
            padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 64px);
          }
        }

        /* ===== SOLO MÓVIL LANDSCAPE ===== */
        @media (orientation: landscape) and (max-height: 480px) {
          .clients-scope .clientdrawer {
            max-width: clamp(44rem, 92vw, 62rem);
          }
          .clients-scope .clientdrawer-form-area {
            display: grid !important;
            align-content: center !important;
            justify-items: stretch !important;
            gap: 0 !important;
          }
          .clients-scope .clientdrawer-grid {
            display: grid !important;
            grid-template-columns: 240px minmax(0, 1fr) !important;
            gap: 1rem 1.25rem !important;
            align-items: center !important;
            width: 100%;
          }
          .clients-scope .clientdrawer-avatar,
          .clients-scope .create-avatar {
            width: 200px !important;
            height: 200px !important;
            border-radius: 9999px !important;
          }
          .clients-scope .clientdrawer-fields,
          .clients-scope .create-fields {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
          .clients-scope .clientdrawer-row-two,
          .clients-scope .create-row-two {
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 0.75rem !important;
          }
        }

        /* ===== TABLA: columnas por dispositivo/orientación ===== */

        /* Base = MÓVIL PORTRAIT: Login | ID */
        .clients-scope .table-grid {
          display: grid;
          align-items: center;
          grid-template-columns: minmax(0, 1fr) 72px;
        }
        .clients-scope .col-taxid,
        .clients-scope .col-trade,
        .clients-scope .col-email,
        .clients-scope .col-phone {
          display: none;
        }

        /* MÓVIL LANDSCAPE (altura baja): Login | CIF/NIF | Nombre Comercial | ID */
        @media (orientation: landscape) and (max-height: 480px) {
          .clients-scope .table-grid {
            grid-template-columns: minmax(0, 1fr) 150px 220px 72px;
          }
          .clients-scope .col-taxid,
          .clients-scope .col-trade {
            display: block;
          }
        }

        /* TABLET PORTRAIT (768–1024): Login | CIF/NIF | Nombre Comercial | ID */
        @media (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {
          .clients-scope .table-grid {
            grid-template-columns: minmax(0, 1fr) 160px 240px 72px;
          }
          .clients-scope .col-taxid,
          .clients-scope .col-trade {
            display: block;
          }
        }

        /* TABLET LANDSCAPE: + Email + Teléfono */
        @media (max-width: 1024px) and (orientation: landscape) and (min-height: 481px) {
          .clients-scope .table-grid {
            grid-template-columns: minmax(0, 1fr) 160px 240px 260px 160px 72px;
          }
          .clients-scope .col-taxid,
          .clients-scope .col-trade,
          .clients-scope .col-email,
          .clients-scope .col-phone {
            display: block;
          }
        }

        /* DESKTOP (≥1025): todas las columnas */
        @media (min-width: 1025px) {
          .clients-scope .table-grid {
            grid-template-columns: minmax(0, 1fr) 180px 280px 280px 180px 72px;
          }
          .clients-scope .col-taxid,
          .clients-scope .col-trade,
          .clients-scope .col-email,
          .clients-scope .col-phone {
            display: block;
          }
        }
      `}</style>

      {/* Header */}
      <header className="mb-4 md:mb-6">
        <Heading
          level={1}
          fill="solid"
          color="var(--accent, var(--brand,#8E2434))"
          fontFamily="var(--font-display, Sora, ui-sans-serif)"
          shadow="soft+brand"
          size="clamp(1.6rem,3.2vw,2.4rem)"
          className="uppercase tracking-widest"
        >
          Clientes
        </Heading>
        <p className={`mt-3 text-sm ${subtleText} hide-on-compact`}>
          Gestión de clientes: busca y filtra tu cartera, crea nuevos registros,
          consulta su ficha y actualiza datos básicos. Próximamente añadiremos
          acciones específicas del módulo (segmentación, contratos, etc.).
        </p>
      </header>

      {/* ====== TOOLBAR ====== */}
      <section
        className={[
          "rounded-2xl border shadow-sm mb-3",
          shellTone,
          "px-3 md:px-4 py-3",
        ].join(" ")}
      >
        <div className="toolbar flex items-center gap-2 sm:gap-3">
          {/* Buscador */}
          <div className="tb-search relative flex-1 min-w-[140px] sm:min-w-[200px] md:min-w-[240px]">
            <input
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearch(e.target.value)
              }
              placeholder="Buscar cliente…"
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
          <div className="tb-actions relative">
            <button
              ref={actionsBtnRef}
              type="button"
              onClick={() => setActionsOpen((v) => !v)}
              className="btn-ik btn-compact inline-flex items-center gap-2 px-3 h-9 rounded-xl border"
              style={
                {
                  ["--btn-ik-accent"]: ACC_ACTIONS,
                  ["--btn-ik-text"]: ACC_ACTIONS,
                  ["--mark-hover-bg"]: ACC_ACTIONS,
                  ["--mark-hover-border"]: ACC_ACTIONS,
                  ["--iconmark-hover-bg"]: ACC_ACTIONS,
                  ["--iconmark-hover-border"]: ACC_ACTIONS,
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
                <MoreHorizontal />
              </IconMark>
              <span className="btn-label">Acciones</span>
              <ChevronDown size={16} />
            </button>

            {actionsOpen && (
              <div
                id="clients-actions-menu"
                className={[
                  "absolute right-0 mt-2 w-48 rounded-xl border shadow-md overflow-hidden z-30",
                  theme === "light"
                    ? "bg-white border-zinc-200"
                    : "bg-[#0D1117] border-zinc-700",
                ].join(" ")}
              >
                {/* NUEVO CLIENTE (solo vistas compactas) */}
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
                      ["--btn-ik-accent"]: ACC_CREATE,
                      ["--btn-ik-text"]: ACC_CREATE,
                      ["--mark-hover-bg"]: ACC_CREATE,
                      ["--mark-hover-border"]: ACC_CREATE,
                      ["--iconmark-hover-bg"]: ACC_CREATE,
                      ["--iconmark-hover-border"]: ACC_CREATE,
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
                    <Building2 />
                  </IconMark>
                  Nuevo cliente
                </button>

                {["Acción 1", "Acción 2", "Acción 3"].map((label) => (
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
                        ["--mark-hover-bg"]: ACC_ACTIONS,
                        ["--mark-hover-border"]: ACC_ACTIONS,
                        ["--iconmark-hover-bg"]: ACC_ACTIONS,
                        ["--iconmark-hover-border"]: ACC_ACTIONS,
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
                      <Edit3 />
                    </IconMark>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botón suelto "Nuevo cliente" */}
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="tb-new btn-ik inline-flex items-center gap-2 px-3 h-9 rounded-xl border"
            style={
              {
                ["--btn-ik-accent"]: ACC_CREATE,
                ["--btn-ik-text"]: ACC_CREATE,
                ["--mark-hover-bg"]: ACC_CREATE,
                ["--mark-hover-border"]: ACC_CREATE,
                ["--iconmark-hover-bg"]: ACC_CREATE,
                ["--iconmark-hover-border"]: ACC_CREATE,
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
              <Building2 />
            </IconMark>
            Nuevo cliente
          </button>
        </div>
      </section>

      {/* ====== TABLA ====== */}
      <section
        className={[
          "rounded-2xl border shadow-sm mb-3",
          shellTone,
          "overflow-hidden flex-1 min-h-0 flex flex-col",
        ].join(" ")}
      >
        {/* Cabecera ⬇⬇⬇ CAMBIO */}
        <div
          className={["table-grid px-4 py-2 border-b", headerTone].join(" ")}
        >
          <div className="text-xs font-semibold opacity-80">Login</div>
          <div className="col-taxid text-xs font-semibold opacity-80">
            CIF/NIF
          </div>
          <div className="col-trade text-xs font-semibold opacity-80">
            Nombre Comercial
          </div>
          <div className="col-email text-xs font-semibold opacity-80">
            Email
          </div>
          <div className="col-phone text-xs font-semibold opacity-80">
            Teléfono
          </div>
          <div className="text-xs font-semibold opacity-80 text-right">ID</div>
        </div>

        {/* Filas ⬇⬇⬇ CAMBIO */}
        <div className="flex-1 min-h-0 overflow-auto overscroll-contain">
          {loading && (
            <div className="px-4 py-3 text-sm">Cargando clientes…</div>
          )}
          {!loading &&
            displayed.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setDetailId(c.id)}
                className={[
                  "w-full text-left table-grid gap-2 px-4 py-3 border-b cursor-pointer transition-colors",
                  theme === "light"
                    ? "hover:bg-zinc-50 border-zinc-100"
                    : "hover:bg-white/10 border-zinc-800",
                ].join(" ")}
              >
                {/* Login + avatar */}
                <div className="flex items-center gap-3">
                  <div
                    className={[
                      "w-8 h-8 rounded-full border flex-none grid place-items-center text-[10px]",
                      theme === "light"
                        ? "border-zinc-400 bg-white"
                        : "border-zinc-600 bg-[#0D1117]",
                    ].join(" ")}
                  />
                  <div className="font-medium truncate">{c.login}</div>
                </div>

                {/* CIF/NIF */}
                <div className="col-taxid text-sm truncate">
                  {c.taxId || "—"}
                </div>

                {/* Nombre comercial */}
                <div className="col-trade text-sm truncate">
                  {c.tradeName || "—"}
                </div>

                {/* Email */}
                <div className="col-email text-sm truncate">
                  {c.email || "—"}
                </div>

                {/* Teléfono */}
                <div className="col-phone text-sm truncate">
                  {c.phone || "—"}
                </div>

                {/* ID */}
                <div className="text-right font-semibold">{c.id}</div>
              </button>
            ))}

          {!loading && displayed.length === 0 && (
            <div className="px-4 py-3 text-sm opacity-70">
              No hay resultados.
            </div>
          )}
        </div>

        {/* Footer */}
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
              onChange={(v) => setPageSize(v)}
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

              {isMobilePortrait ? (
                <button
                  type="button"
                  className={[
                    "w-7 h-7 grid place-items-center rounded-full border cursor-default",
                    theme === "light"
                      ? "bg-zinc-900 border-zinc-900 text-white"
                      : "bg-white border-white text-black",
                  ].join(" ")}
                >
                  {page}
                </button>
              ) : (
                buildPageItems(page, totalPages).map((it, idx) =>
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

            <div>{filtered.length} cliente(s)</div>
          </div>
        </div>
      </section>

      {/* Modales / Drawer */}
      {createOpen && (
        <CreateClientModal
          theme={theme}
          onClose={() => setCreateOpen(false)}
          onCreated={async () => {
            setCreateOpen(false);
            const fresh = await listClients();
            setList(fresh);
          }}
        />
      )}

      {detailId != null && (
        <ClientDetailDrawer
          id={detailId}
          theme={theme}
          onClose={() => setDetailId(null)}
          onDeleted={async () => {
            setDetailId(null);
            const fresh = await listClients();
            setList(fresh);
          }}
          onSaved={async () => {
            setDetailId(null);
            const fresh = await listClients();
            setList(fresh);
          }}
        />
      )}
    </div>
  );
}

/* ====================== Dropdown: Page size (footer) ===================== */

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

/* ============================ Modal: Crear Cliente ============================ */

function CreateClientModal({
  theme,
  onClose,
  onCreated,
}: {
  theme: Theme;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}) {
  const [login, setLogin] = useState("");
  const [taxId, setTaxId] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState("");
  const [busy, setBusy] = useState(false);

  const isLight = theme === "light";

  const headerOpp = isLight
    ? "bg-[#0D1117] text-white border-zinc-900"
    : "bg-white text-black border-white";
  const headerIconHover = isLight ? "hover:bg-white/10" : "hover:bg-black/5";

  const markBase = {
    ["--mark-bg"]: isLight ? "#e2e5ea" : "#0b0b0d",
    ["--mark-border"]: isLight ? "#0e1117" : "#ffffff",
    ["--mark-fg"]: isLight ? "#010409" : "#ffffff",
  } as React.CSSProperties;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!login.trim() || !taxId.trim() || !tradeName.trim()) return;
    setBusy(true);
    try {
      await createClient({
        login: login.trim(),
        taxId: taxId.trim(),
        tradeName: tradeName.trim(),
        legalName: legalName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        mobile: mobile.trim(),
      });
      await onCreated();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] grid place-items-center p-4"
      onMouseDown={onClose}
    >
      <div
        className={[
          "create-client-modal relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden",
          isLight ? "bg-white border-zinc-300" : "bg-[#0D1117] border-zinc-700",
        ].join(" ")}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className={[
            "flex items-center justify-between px-5 pt-4 pb-3",
            headerOpp,
          ].join(" ")}
        >
          <h2 className="text-lg font-semibold">Nuevo cliente</h2>
          <button
            type="button"
            className={[
              "rounded-full p-1.5 transition-colors",
              headerIconHover,
            ].join(" ")}
            onClick={onClose}
            aria-label="Cerrar"
            style={{ cursor: "pointer" }}
          >
            <X />
          </button>
        </div>

        <form className="px-5 pb-5 pt-4" onSubmit={submit} autoComplete="off">
          <div className="create-layout grid gap-4">
            <div className="flex justify-center my-2">
              <div
                className={[
                  "create-avatar w-36 h-36 md:w-40 md:h-40 rounded-full border grid place-items-center",
                  isLight
                    ? "border-zinc-400 bg-white"
                    : "border-zinc-600 bg-[#0D1117]",
                ].join(" ")}
              />
            </div>

            <div className="create-fields grid gap-3">
              <div className="create-row-two grid gap-3">
                <label className="block">
                  <span className="block text-sm mb-1 opacity-80">Login *</span>
                  <input
                    value={login}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLogin(e.target.value)
                    }
                    placeholder="Código / login del cliente"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="none"
                    spellCheck={false}
                    className={[
                      "w-full h-11 rounded-xl px-3 border outline-none",
                      isLight
                        ? "bg-[#F6F8FA] border-zinc-300 text-zinc-900"
                        : "bg-[#0D1117] border-zinc-700 text-white",
                      "focus:ring-2 focus:ring-[var(--brand,#8E2434)]/30",
                    ].join(" ")}
                  />
                </label>

                <label className="block">
                  <span className="block text-sm mb-1 opacity-80">
                    CIF/NIF *
                  </span>
                  <input
                    value={taxId}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setTaxId(e.target.value)
                    }
                    placeholder="A12345678 / 12345678Z"
                    className={[
                      "w-full h-11 rounded-xl px-3 border outline-none",
                      isLight
                        ? "bg-[#F6F8FA] border-zinc-300 text-zinc-900"
                        : "bg-[#0D1117] border-zinc-700 text-white",
                      "focus:ring-2 focus:ring-[var(--brand,#8E2434)]/30",
                    ].join(" ")}
                  />
                </label>
              </div>

              <label className="block">
                <span className="block text-sm mb-1 opacity-80">
                  Nombre comercial *
                </span>
                <input
                  value={tradeName}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setTradeName(e.target.value)
                  }
                  placeholder="Nombre comercial"
                  className={[
                    "w-full h-11 rounded-xl px-3 border outline-none",
                    isLight
                      ? "bg-[#F6F8FA] border-zinc-300 text-zinc-900"
                      : "bg-[#0D1117] border-zinc-700 text-white",
                    "focus:ring-2 focus:ring-[var(--brand,#8E2434)]/30",
                  ].join(" ")}
                />
              </label>

              <div className="create-row-two grid gap-3">
                <label className="block">
                  <span className="block text-sm mb-1 opacity-80">
                    Razón social
                  </span>
                  <input
                    value={legalName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLegalName(e.target.value)
                    }
                    placeholder="Razón social"
                    className={[
                      "w-full h-11 rounded-xl px-3 border outline-none",
                      isLight
                        ? "bg-[#F6F8FA] border-zinc-300 text-zinc-900"
                        : "bg-[#0D1117] border-zinc-700 text-white",
                      "focus:ring-2 focus:ring-[var(--brand,#8E2434)]/30",
                    ].join(" ")}
                  />
                </label>

                <label className="block">
                  <span className="block text-sm mb-1 opacity-80">Email</span>
                  <input
                    value={email}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEmail(e.target.value)
                    }
                    placeholder="Introduce tu email"
                    type="email"
                    autoComplete="off"
                    className={[
                      "w-full h-11 rounded-xl px-3 border outline-none",
                      isLight
                        ? "bg-[#F6F8FA] border-zinc-300 text-zinc-900"
                        : "bg-[#0D1117] border-zinc-700 text-white",
                      "focus:ring-2 focus:ring-[var(--brand,#8E2434)]/30",
                    ].join(" ")}
                  />
                </label>
              </div>

              <div className="create-row-two grid gap-3">
                <label className="block">
                  <span className="block text-sm mb-1 opacity-80">
                    Teléfono
                  </span>
                  <input
                    value={phone}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPhone(e.target.value)
                    }
                    placeholder="Ej. 911 000 000"
                    className={[
                      "w-full h-11 rounded-xl px-3 border outline-none",
                      isLight
                        ? "bg-[#F6F8FA] border-zinc-300 text-zinc-900"
                        : "bg-[#0D1117] border-zinc-700 text-white",
                      "focus:ring-2 focus:ring-[var(--brand,#8E2434)]/30",
                    ].join(" ")}
                  />
                </label>

                <label className="block">
                  <span className="block text-sm mb-1 opacity-80">Móvil</span>
                  <input
                    value={mobile}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setMobile(e.target.value)
                    }
                    placeholder="Ej. 600 000 000"
                    className={[
                      "w-full h-11 rounded-xl px-3 border outline-none",
                      isLight
                        ? "bg-[#F6F8FA] border-zinc-300 text-zinc-900"
                        : "bg-[#0D1117] border-zinc-700 text-white",
                      "focus:ring-2 focus:ring-[var(--brand,#8E2434)]/30",
                    ].join(" ")}
                  />
                </label>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
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
                  color: "#8E2434",
                  ["--btn-ik-accent"]: "#8E2434",
                  ["--btn-ik-text"]: "#8E2434",
                  ["--mark-hover-bg"]: "#8E2434",
                  ["--mark-hover-border"]: "#8E2434",
                  ["--iconmark-hover-bg"]: "#8E2434",
                  ["--iconmark-hover-border"]: "#8E2434",
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
              disabled={
                busy || !login.trim() || !taxId.trim() || !tradeName.trim()
              }
              className={[
                "btn-ik inline-flex items-center gap-2 px-4 h-10 rounded-xl border",
                isLight
                  ? "bg-white text-zinc-900 border-zinc-300 hover:bg-zinc-100"
                  : "bg-[#0D1117] text-white border-zinc-700 hover:bg-zinc-800",
                busy || !login.trim() || !taxId.trim() || !tradeName.trim()
                  ? "opacity-60 pointer-events-none"
                  : "",
              ].join(" ")}
              style={
                {
                  ["--btn-ik-accent"]: ACC_CREATE,
                  ["--btn-ik-text"]: ACC_CREATE,
                  ["--mark-hover-bg"]: ACC_CREATE,
                  ["--mark-hover-border"]: ACC_CREATE,
                  ["--iconmark-hover-bg"]: ACC_CREATE,
                  ["--iconmark-hover-border"]: ACC_CREATE,
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
                <Building2 />
              </IconMark>
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ====================== Drawer lateral: Detalle Cliente ====================== */

function ClientDetailDrawer({
  id,
  theme,
  onClose,
  onDeleted,
  onSaved,
}: {
  id: number;
  theme: Theme;
  onClose: () => void;
  onDeleted: () => Promise<void> | void;
  onSaved: () => Promise<void> | void;
}) {
  const [info, setInfo] = useState<ClientInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [enter, setEnter] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isLight = theme === "light";

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await getClient(id);
        if (alive) setInfo(data);
      } catch {
        if (alive)
          setInfo({
            id,
            login: "",
            taxId: "",
            tradeName: "",
            legalName: "",
            email: "",
            phone: "",
            mobile: "",
          });
      }
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

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!info) return;
    setBusy(true);
    try {
      await updateClient(info.id, {
        login: info.login,
        taxId: info.taxId,
        tradeName: info.tradeName,
        legalName: info.legalName,
        email: info.email,
        phone: info.phone,
        mobile: info.mobile,
      });
      await onSaved();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!info) return;
    if (!confirm(`¿Eliminar al cliente “${info.login}”?`)) return;
    setBusy(true);
    try {
      await deleteClient(info.id);
      await onDeleted();
    } finally {
      setBusy(false);
    }
  }

  const panelTone = isLight
    ? "bg-white border-zinc-300"
    : "bg-[#0D1117] border-zinc-700";
  const headerOpp = isLight
    ? "bg-[#0D1117] text-white border-zinc-900"
    : "bg-white text-black border-white";
  const headerIconHover = isLight ? "hover:bg-white/10" : "hover:bg-black/5";

  const markBase = {
    ["--mark-bg"]: isLight ? "#e2e5ea" : "#0b0b0d",
    ["--mark-border"]: isLight ? "#0e1117" : "#ffffff",
    ["--mark-fg"]: isLight ? "#010409" : "#ffffff",
    ["--iconmark-bg"]: isLight ? "#e2e5ea" : "#0b0b0d",
    ["--iconmark-border"]: isLight ? "#0e1117" : "#ffffff",
    ["--iconmark-fg"]: isLight ? "#010409" : "#ffffff",
  } as React.CSSProperties;

  return (
    <div className="fixed inset-0 z-[60]">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside
        className={[
          "clientdrawer absolute right-0 top-0 h-full w-full max-w-xl border-l shadow-2xl",
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
          className={[
            "flex items-center justify-between px-5 py-3 border-b",
            headerOpp,
          ].join(" ")}
        >
          <h2 className="text-lg font-semibold">Detalles del cliente</h2>

          <div className="flex items-center gap-2" ref={menuRef}>
            <div className="relative">
              <button
                type="button"
                aria-label="Acciones"
                onClick={() => setMenuOpen((v) => !v)}
                className={[
                  "rounded-full p-1.5 transition-colors",
                  headerIconHover,
                ].join(" ")}
                style={{ cursor: "pointer" }}
              >
                <MoreHorizontal />
              </button>

              {menuOpen && (
                <div
                  className={[
                    "absolute right-0 mt-2 w-44 rounded-xl border shadow-md overflow-hidden z-30",
                    isLight
                      ? "bg-white border-zinc-200 text-black"
                      : "bg-[#0D1117] border-zinc-700 text-white",
                  ].join(" ")}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      void handleDelete();
                    }}
                    className={[
                      "btn-ik w-full flex items-center gap-2 px-3 py-2 text-left text-sm",
                      isLight ? "hover:bg-zinc-100" : "hover:bg-zinc-800/50",
                    ].join(" ")}
                    style={
                      {
                        ["--btn-ik-accent"]: "#8E2434",
                        ["--btn-ik-text"]: "#8E2434",
                        ["--mark-hover-bg"]: "#8E2434",
                        ["--mark-hover-border"]: "#8E2434",
                        ["--iconmark-hover-bg"]: "#8E2434",
                        ["--iconmark-hover-border"]: "#8E2434",
                        cursor: "pointer",
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
                      <Trash2 />
                    </IconMark>
                    Eliminar
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              className={[
                "rounded-full p-1.5 transition-colors",
                headerIconHover,
              ].join(" ")}
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
          id="client-detail-form"
          className="clientdrawer-form-area flex-1 overflow-auto px-5 pt-4 pb-24"
          onSubmit={handleSave}
        >
          {!info ? (
            <p className="opacity-80 text-sm">Cargando…</p>
          ) : (
            <div className="clientdrawer-grid">
              <div className="flex justify-center my-4 md:my-6">
                <div
                  className={[
                    "clientdrawer-avatar rounded-full border grid place-items-center",
                    "w-40 h-40 md:w-44 md:h-44",
                    isLight
                      ? "border-zinc-400 bg-white"
                      : "border-zinc-600 bg-[#0D1117]",
                  ].join(" ")}
                />
              </div>

              <div className="clientdrawer-fields">
                <Field
                  label="Login"
                  value={info.login}
                  onChange={(v) => setInfo({ ...info, login: v })}
                  theme={theme}
                />
                <Field
                  label="CIF/NIF"
                  value={info.taxId}
                  onChange={(v) => setInfo({ ...info, taxId: v })}
                  theme={theme}
                />
                <Field
                  label="Nombre comercial"
                  value={info.tradeName}
                  onChange={(v) => setInfo({ ...info, tradeName: v })}
                  theme={theme}
                />
                <Field
                  label="Razón social"
                  value={info.legalName}
                  onChange={(v) => setInfo({ ...info, legalName: v })}
                  theme={theme}
                />
                <Field
                  label="Email"
                  value={info.email}
                  onChange={(v) => setInfo({ ...info, email: v })}
                  theme={theme}
                />

                <div className="clientdrawer-row-two">
                  <Field
                    label="Teléfono"
                    value={info.phone}
                    onChange={(v) => setInfo({ ...info, phone: v })}
                    theme={theme}
                  />
                  <Field
                    label="Móvil"
                    value={info.mobile}
                    onChange={(v) => setInfo({ ...info, mobile: v })}
                    theme={theme}
                  />
                </div>
              </div>
            </div>
          )}
        </form>

        <div
          className={[
            "absolute bottom-0 left-0 right-0 px-5 py-3 border-t",
            isLight
              ? "bg-[#E7EBF1] border-zinc-300"
              : "bg-[#131821] border-zinc-700",
          ].join(" ")}
        >
          <div className="flex items-center justify-end gap-3">
            <button
              type="submit"
              form="client-detail-form"
              disabled={busy || !info}
              className={[
                "btn-ik inline-flex items-center gap-2 px-4 h-10 rounded-xl border",
                isLight
                  ? "bg-white text-zinc-900 border-zinc-300 hover:bg-zinc-100"
                  : "bg-[#0D1117] text-white border-zinc-700 hover:bg-zinc-800",
                busy || !info ? "opacity-60 pointer-events-none" : "",
              ].join(" ")}
              style={
                {
                  ["--btn-ik-accent"]: ACC_ACTIONS,
                  ["--btn-ik-text"]: ACC_ACTIONS,
                  ["--mark-hover-bg"]: ACC_ACTIONS,
                  ["--mark-hover-border"]: ACC_ACTIONS,
                  ["--iconmark-hover-bg"]: ACC_ACTIONS,
                  ["--iconmark-hover-border"]: ACC_ACTIONS,
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

/* ------------------------------ Campo ------------------------------ */

function Field({
  label,
  value,
  onChange,
  theme,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  theme: Theme;
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
