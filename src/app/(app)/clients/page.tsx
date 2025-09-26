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
import MJSpinner from "@/components/ui/MJSpinner";
import { getInitialTheme, type Theme } from "@/lib/theme";

/* --------------------------- Tipos & helpers --------------------------- */

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
  website?: string;
  status: 1 | 2;
  createdAt?: string;
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

const CLIENTS_ACCENT = "#F59E0B"; // ámbar
const ACC_CREATE = CLIENTS_ACCENT;
const ACC_ACTIONS = "#6366F1";

/* ---------------------------- Hooks util --------------------------- */

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

function extractArray(root: unknown): unknown[] {
  if (Array.isArray(root)) return root as unknown[];
  if (isObj(root)) {
    const r = root as Record<string, unknown>;
    if (Array.isArray(r.data)) return r.data as unknown[];
    if (Array.isArray(r.items)) return r.items as unknown[];
    if (Array.isArray(r.clients)) return r.clients as unknown[];
  }
  return [];
}
function extractTotal(root: unknown): number {
  if (!isObj(root)) return NaN;
  const r = root as Record<string, unknown>;
  const cands: unknown[] = [
    r.total,
    r.count,
    r.totalCount,
    r.Total,
    r.recordsTotal,
    isObj(r.meta) ? (r.meta as Record<string, unknown>).total : undefined,
    isObj(r.pagination)
      ? (r.pagination as Record<string, unknown>).total
      : undefined,
  ];
  for (const c of cands) {
    const n = Number(c ?? NaN);
    if (Number.isFinite(n)) return n;
  }
  return NaN;
}
function buildQS(params: Record<string, string | number | undefined>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined) return;
    usp.set(k, String(v));
  });
  const s = usp.toString();
  return s ? `?${s}` : "";
}

// === Status (normalizar 1|2 desde cualquier formato que venga) ===
function readStatus(d: Record<string, unknown>): 1 | 2 {
  const tryId = (v: unknown): number | undefined => {
    if (typeof v === "number") return Number.isFinite(v) ? v : undefined;
    if (typeof v === "string") {
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    }
    if (isObj(v)) {
      const id = (v as Record<string, unknown>).id;
      if (typeof id === "number") return Number.isFinite(id) ? id : undefined;
      if (typeof id === "string") {
        const n = Number(id);
        return Number.isFinite(n) ? n : undefined;
      }
    }
    return undefined;
  };

  const candidates = [
    tryId(d.status),
    tryId((d as Record<string, unknown>)["status_id"]),
    tryId((d as Record<string, unknown>)["clientStatus"]),
    tryId((d as Record<string, unknown>)["client_status"]),
  ];

  for (const c of candidates) {
    if (c === 1 || c === 2) return c as 1 | 2;
  }

  const s = String(d.status ?? "")
    .toLowerCase()
    .trim();
  if (["1", "true", "active", "activo"].includes(s)) return 1;
  return 2;
}

/* ============================== API CLIENTS ============================== */

type ClientsQuery = { q: string; page: number; pageSize: number };

async function fetchClientsPage({
  q,
  page,
  pageSize,
}: ClientsQuery): Promise<{ items: ClientListItem[]; total: number }> {
  const offset = Math.max(0, (page - 1) * pageSize);

  const res = await fetch(
    `/api/clients/list${buildQS({ q, offset, limit: pageSize })}`,
    { cache: "no-store" }
  );

  let root: unknown = null;
  try {
    root = await res.json();
  } catch {
    root = null;
  }

  const arr = extractArray(root);
  const totalFromApi = extractTotal(root);

  const out: ClientListItem[] = [];
  for (const it of arr) {
    if (!isObj(it)) continue;
    const o = it as Record<string, unknown>;

    const id = pickNum(o.id ?? o.ID ?? o.clientId ?? o.ClientId ?? o.uid, NaN);
    const login = pickStr(
      o.login ?? o.Login ?? o.code ?? o.Code ?? o.client_login
    );
    const taxId = pickStr(o.tax_id ?? o.Tax_id ?? o.taxId ?? "");
    const tradeName = pickStr(
      o.trade_Name ?? o.Trade_Name ?? o.tradeName ?? ""
    );
    const email = pickStr(o.email ?? o.Email ?? "");
    const phone = pickStr(o.phone ?? o.Phone ?? "");

    if (Number.isFinite(id) && login)
      out.push({ id, login, taxId, tradeName, email, phone });
  }

  // Filtro q por si el backend no lo aplica
  const qNorm = q.trim().toLowerCase();
  const filtered = qNorm
    ? out.filter((c) =>
        [c.login, c.taxId, c.tradeName, c.email, c.phone]
          .filter(Boolean)
          .some((s) => s.toLowerCase().includes(qNorm))
      )
    : out;

  return {
    items:
      filtered.length > pageSize || offset > 0
        ? filtered.slice(offset, offset + pageSize)
        : filtered,
    total: Number.isFinite(totalFromApi) ? totalFromApi : filtered.length,
  };
}

async function getClient(id: number): Promise<ClientInfo> {
  const res = await fetch(`/api/clients/getClient/${id}`, {
    method: "GET",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
  });

  const json = await fetchJSONSafe<unknown>(res);
  if (!res.ok || !isObj(json)) {
    return {
      id,
      login: "",
      taxId: "",
      tradeName: "",
      legalName: "",
      email: "",
      phone: "",
      mobile: "",
      website: "",
      status: 1,
    };
  }

  const r = json as Record<string, unknown>;
  return {
    id: pickNum(r.id ?? id, id),
    login: pickStr(r.login ?? r.Login),
    taxId: pickStr(r.tax_id ?? r.Tax_id),
    tradeName: pickStr(r.trade_Name ?? r.Trade_Name),
    legalName: pickStr(r.legal_Name ?? r.Legal_Name),
    email: pickStr(r.email ?? r.Email),
    phone: pickStr(r.phone ?? r.Phone),
    mobile: pickStr(r.mobile ?? r.Mobile),
    website: pickStr(r.website ?? r.Website),
    status: readStatus(r),
    createdAt: pickStr(r.created_At ?? r.createdAt ?? ""),
  };
}

type CreatePayload = {
  login: string;
  taxId: string;
  tradeName: string;
  legalName?: string;
  email?: string;
  phone?: string;
  mobile?: string;
  website?: string;
};

async function createClient(payload: CreatePayload): Promise<{ id: number }> {
  // Body EXACTO que espera el backend
  const body = {
    clientToCreate: {
      Login: payload.login,
      Tax_id: payload.taxId,
      Trade_Name: payload.tradeName,
      ...(payload.legalName ? { Legal_Name: payload.legalName } : {}),
      ...(payload.email ? { Email: payload.email } : {}),
      ...(payload.phone ? { Phone: payload.phone } : {}),
      ...(payload.mobile ? { Mobile: payload.mobile } : {}),
      ...(payload.website ? { Website: payload.website } : {}),
    },
  };

  const res = await fetch("/api/clients/create", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "text/plain,application/json",
    },
    body: JSON.stringify(body),
  });

  // el upstream a veces devuelve text/plain
  let data: unknown = null;
  const ct = res.headers.get("content-type") || "";
  try {
    data = ct.includes("application/json")
      ? await res.json()
      : await res.text();
  } catch {
    data = null;
  }

  if (!res.ok) {
    const msg =
      (typeof data === "string" && data) ||
      ((data as { error?: string })?.error ?? "Error creando cliente");
    throw new Error(msg);
  }

  // intenta sacar el id devuelto
  if (typeof data === "number") return { id: data };
  if (typeof data === "string") {
    const n = Number(data);
    if (Number.isFinite(n)) return { id: n };
  }
  if (data && typeof data === "object") {
    const r = data as Record<string, unknown>;
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
      const n = Number(c ?? NaN);
      if (Number.isFinite(n)) return { id: n };
    }
  }
  return { id: 0 };
}

async function updateClient(id: number, payload: Partial<ClientInfo>) {
  const login = (payload.login ?? "").trim();
  const taxId = (payload.taxId ?? "").trim();
  const tradeName = (payload.tradeName ?? "").trim();

  if (!login || !taxId || !tradeName) {
    throw new Error("Login, CIF/NIF y Nombre comercial son obligatorios.");
  }

  // DTO plano que espera la API
  const body: Record<string, unknown> = {
    Id: id,
    Login: login,
    Tax_id: taxId,
    Trade_Name: tradeName,
  };

  if (payload.legalName != null) body.Legal_Name = String(payload.legalName);
  if (payload.email != null) body.Email = String(payload.email);
  if (payload.phone != null) body.Phone = String(payload.phone);
  if (payload.mobile != null) body.Mobile = String(payload.mobile);
  if (payload.website != null) body.Website = String(payload.website);

  // Status como objeto { id: 1 | 2 }
  if (payload.status === 1 || payload.status === 2) {
    body.Status = { id: payload.status };
  }

  const res = await fetch(`/api/clients/update/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // el upstream suele devolver text/plain en errores
    let msg = `Error actualizando cliente ${id}`;
    try {
      const txt = await res.text();
      if (txt) msg = txt;
    } catch {}
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
      (isObj(j) && typeof (j as { error?: string }).error === "string"
        ? (j as { error?: string }).error
        : undefined) ?? `Error eliminando cliente ${id}`;
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
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);

  // Paginación
  const [pageSize, setPageSize] = useState<number>(25);
  const [page, setPage] = useState<number>(1);

  // Acciones dropdown
  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsBtnRef = useRef<HTMLButtonElement | null>(null);

  // Modales
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  /* ====== Carga paginada (igual que usuarios) ====== */
  useEffect(() => setPage(1), [search, pageSize]);

  useEffect(() => {
    if (!mounted) return;
    let alive = true;
    setLoading(true);
    (async () => {
      try {
        const { items, total } = await fetchClientsPage({
          q: search.trim(),
          page,
          pageSize,
        });
        if (alive) {
          setList(items);
          setTotalCount(total);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [mounted, search, page, pageSize, reloadToken]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((totalCount || 0) / pageSize)),
    [totalCount, pageSize]
  );
  useEffect(() => setPage((p) => Math.min(p, totalPages)), [totalPages]);

  /* Cerrar acciones al hacer click fuera */
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

        /* ===== Botones “IconMark” ===== */
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

        /* Móvil vertical: search + acciones compactas */
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

        /* ===== SOLO MÓVIL LANDSCAPE: layout del drawer ===== */
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
          column-gap: 0.5rem;
        }
        .clients-scope .col-taxid,
        .clients-scope .col-trade,
        .clients-scope .col-email,
        .clients-scope .col-phone {
          display: none;
        }

        /* Cabeceras centradas en su columna */
        .clients-scope .table-head > div {
          text-align: center;
        }

        /* MÓVIL LANDSCAPE (altura baja) */
        @media (orientation: landscape) and (max-height: 480px) {
          .clients-scope .table-grid {
            grid-template-columns: minmax(0, 1fr) 150px 220px 72px;
          }
          .clients-scope .col-taxid,
          .clients-scope .col-trade {
            display: block;
          }
        }

        /* TABLET PORTRAIT (768–1024) */
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
            /*      Login              CIF      Nombre Com.         Email                Tel.   ID  */
            grid-template-columns:
              minmax(160px, 0.8fr) 130px minmax(200px, 1.05fr)
              minmax(200px, 1fr) 120px 56px;
            column-gap: 0.75rem;
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
            /*      Login              CIF      Nombre Com.           Email               Tel.   ID  */
            grid-template-columns:
              minmax(180px, 0.75fr) 140px minmax(240px, 1.15fr)
              minmax(220px, 1.05fr) 140px 56px;
            column-gap: 0.75rem;
          }
          .clients-scope .col-taxid,
          .clients-scope .col-trade,
          .clients-scope .col-email,
          .clients-scope .col-phone {
            display: block;
          }
        }

        /* Solo scroll vertical en filas (evitar barra horizontal) */
        .clients-scope .table-scroll {
          overflow-y: auto;
          overflow-x: hidden;
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
          consulta su ficha y actualiza datos básicos.
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
        {/* Cabecera */}
        <div
          className={[
            "table-grid table-head px-4 py-2 border-b",
            headerTone,
          ].join(" ")}
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
          <div className="text-xs font-semibold opacity-80">ID</div>
        </div>

        {/* Filas */}
        <div className="table-scroll flex-1 min-h-0 overscroll-contain relative">
          {loading && (
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <MJSpinner size={120} label="Cargando clientes…" />
            </div>
          )}

          {!loading &&
            list.map((c) => (
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

                <div className="col-taxid text-sm truncate">
                  {c.taxId || "—"}
                </div>
                <div className="col-trade text-sm truncate">
                  {c.tradeName || "—"}
                </div>
                <div className="col-email text-sm truncate">
                  {c.email || "—"}
                </div>
                <div className="col-phone text-sm truncate">
                  {c.phone || "—"}
                </div>
                <div className="text-right font-semibold">{c.id}</div>
              </button>
            ))}

          {!loading && list.length === 0 && (
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

            <div>{totalCount} cliente(s)</div>
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
            setReloadToken((t) => t + 1);
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
            setReloadToken((t) => t + 1);
          }}
          onSaved={async () => {
            setDetailId(null);
            setReloadToken((t) => t + 1);
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
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);

  const isLight = theme === "light";

  const headerOpp = isLight
    ? "bg-[#0D1117] text-white border-zinc-900"
    : "bg-white text-black border-white";
  const headerIconHover = isLight ? "hover:bg-white/10" : "hover:bg-black/5";

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
        website: website.trim(),
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
        {busy && <MJSpinner overlay size={110} label="Creando cliente…" />}

        <div
          className={[
            "flex items-center justify-between px-5 pt-4 pb-3",
            headerOpp,
          ].join(" ")}
        >
          <h2 className="text-lg font-semibold">Nuevo cliente</h2>
          <button
            type="button"
            className={["rounded-full p-1.5", headerIconHover].join(" ")}
            onClick={onClose}
            aria-label="Cerrar"
            style={{ cursor: "pointer" }}
          >
            <X />
          </button>
        </div>

        <form className="px-5 pb-5 pt-4" onSubmit={submit} autoComplete="off">
          <div className="grid gap-4">
            {/* Avatar */}
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

            {/* Login + CIF/NIF */}
            <div className="grid gap-3 md:grid-cols-2">
              <Field
                label="Login *"
                value={login}
                onChange={setLogin}
                theme={theme}
              />
              <Field
                label="CIF/NIF *"
                value={taxId}
                onChange={setTaxId}
                theme={theme}
              />
            </div>

            {/* Nombre comercial */}
            <Field
              label="Nombre comercial *"
              value={tradeName}
              onChange={setTradeName}
              theme={theme}
            />

            {/* Razón social + Email */}
            <div className="grid gap-3 md:grid-cols-2">
              <Field
                label="Razón social"
                value={legalName}
                onChange={setLegalName}
                theme={theme}
              />
              <Field
                label="Email"
                value={email}
                onChange={setEmail}
                theme={theme}
              />
            </div>

            {/* Teléfono + Móvil */}
            <div className="grid gap-3 md:grid-cols-2">
              <Field
                label="Teléfono"
                value={phone}
                onChange={setPhone}
                theme={theme}
              />
              <Field
                label="Móvil"
                value={mobile}
                onChange={setMobile}
                theme={theme}
              />
            </div>

            {/* Web */}
            <Field
              label="Web"
              value={website}
              onChange={setWebsite}
              theme={theme}
            />
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
                } as React.CSSProperties
              }
            >
              <IconMark size="xs" borderWidth={2}>
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
                  ["--btn-ik-accent"]: CLIENTS_ACCENT,
                  ["--btn-ik-text"]: CLIENTS_ACCENT,
                } as React.CSSProperties
              }
            >
              <IconMark size="xs" borderWidth={2}>
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
  const [busyLabel, setBusyLabel] = useState<string | null>(null);
  const [enter, setEnter] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [ask1, setAsk1] = useState(false);
  const [ask2, setAsk2] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isLight = theme === "light";

  // cargar
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
            website: "",
            status: 1,
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

  function formatDDMMYYYY(iso?: string) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (isNaN(+d)) return "—";
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yy = d.getFullYear();
    return `${dd}/${mm}/${yy}`;
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!info) return;
    setBusyLabel("Guardando cambios…");
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
        website: info.website,
        status: info.status, // 👈 1/2 del checkbox
      });
      await onSaved();
    } finally {
      setBusy(false);
      setBusyLabel(null);
    }
  }

  async function reallyDelete() {
    if (!info) return;
    setBusyLabel("Eliminando cliente…");
    setBusy(true);
    try {
      await deleteClient(info.id);
      await onDeleted();
    } finally {
      setBusy(false);
      setBusyLabel(null);
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
        {/* Overlay del drawer */}
        {(!info || busy) && (
          <MJSpinner
            overlay
            size={120}
            label={!info ? "Cargando…" : busyLabel ?? "Procesando…"}
          />
        )}

        {/* Header */}
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
                className={["rounded-full p-1.5", headerIconHover].join(" ")}
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
                      setAsk1(true);
                    }}
                    className={[
                      "btn-ik w-full flex items-center gap-2 px-3 py-2 text-left text-sm",
                      isLight ? "hover:bg-zinc-100" : "hover:bg-zinc-800/50",
                    ].join(" ")}
                    style={
                      {
                        ["--btn-ik-accent"]: "#8E2434",
                        ["--btn-ik-text"]: "#8E2434",
                        cursor: "pointer",
                      } as React.CSSProperties
                    }
                  >
                    <IconMark size="xs" borderWidth={2} style={markBase}>
                      <Trash2 />
                    </IconMark>
                    Eliminar
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              className={["rounded-full p-1.5", headerIconHover].join(" ")}
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
          {!info ? null : (
            <div className="w-full max-w-3xl mx-auto">
              {/* Top: avatar + check de estado */}
              <div className="flex flex-col items-center gap-4 my-4 md:my-6">
                <div
                  className={[
                    "rounded-full border grid place-items-center",
                    "w-40 h-40 md:w-44 md:h-44",
                    isLight
                      ? "border-zinc-400 bg-white"
                      : "border-zinc-600 bg-[#0D1117]",
                  ].join(" ")}
                />
                <label className="inline-flex items-center gap-2 select-none text-sm">
                  <input
                    type="checkbox"
                    checked={info.status === 1}
                    onChange={(e) =>
                      setInfo({ ...info, status: e.target.checked ? 1 : 2 })
                    }
                    className={[
                      "w-4 h-4 rounded border",
                      isLight
                        ? "border-zinc-400"
                        : "border-zinc-600 bg-[#0D1117]",
                    ].join(" ")}
                  />
                  <span className={isLight ? "text-zinc-800" : "text-zinc-200"}>
                    Activo
                  </span>
                </label>
              </div>

              {/* Campos debajo */}
              <div className="grid gap-3">
                {/* Fila: Login | CIF/NIF */}
                <div className="grid gap-3 md:grid-cols-2">
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
                </div>

                {/* Fila: Nombre comercial */}
                <Field
                  label="Nombre comercial"
                  value={info.tradeName}
                  onChange={(v) => setInfo({ ...info, tradeName: v })}
                  theme={theme}
                />

                {/* Fila: Razón social */}
                <Field
                  label="Razón social"
                  value={info.legalName}
                  onChange={(v) => setInfo({ ...info, legalName: v })}
                  theme={theme}
                />

                {/* Fila: Email */}
                <Field
                  label="Email"
                  value={info.email}
                  onChange={(v) => setInfo({ ...info, email: v })}
                  theme={theme}
                />

                {/* Fila: Teléfono | Móvil */}
                <div className="grid gap-3 md:grid-cols-2">
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

                {/* Fila: Website */}
                <Field
                  label="Web"
                  value={info.website || ""}
                  onChange={(v) => setInfo({ ...info, website: v })}
                  theme={theme}
                />
              </div>
            </div>
          )}
        </form>

        {/* Footer */}
        <div
          className={[
            "absolute bottom-0 left-0 right-0 px-5 py-3 border-t",
            isLight
              ? "bg-[#E7EBF1] border-zinc-300"
              : "bg-[#131821] border-zinc-700",
          ].join(" ")}
        >
          <div className="flex items-center justify-between gap-3">
            <div
              className={[
                "text-[12.5px]",
                isLight ? "text-zinc-700" : "text-zinc-300",
              ].join(" ")}
            >
              <span className="opacity-70 mr-1">Fecha de Creación:</span>
              <span className="font-semibold">
                {formatDDMMYYYY(info?.createdAt)}
              </span>
            </div>

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
                } as WithToolbarVars
              }
            >
              <IconMark size="xs" borderWidth={2}>
                <Save />
              </IconMark>
              Guardar
            </button>
          </div>
        </div>
      </aside>

      {/* Confirmaciones */}
      {ask1 && (
        <ConfirmModal
          theme={theme}
          title="Se va a eliminar el cliente, ¿está seguro?"
          primary={{
            label: "Sí",
            onClick: () => {
              setAsk1(false);
              setAsk2(true);
            },
          }}
          secondary={{ label: "No", onClick: () => setAsk1(false) }}
        />
      )}

      {ask2 && info && (
        <ConfirmModal
          theme={theme}
          title={`Esta acción es irreversible, ¿seguro de querer eliminar el cliente "${info.login}"?`}
          primary={{
            label: "Sí",
            onClick: async () => {
              setAsk2(false);
              await reallyDelete();
            },
          }}
          secondary={{ label: "No", onClick: () => setAsk2(false) }}
          reversed
        />
      )}
    </div>
  );
}

/* ------- Modal pequeño de confirmación (reutilizado) ------- */
function ConfirmModal({
  theme,
  title,
  primary,
  secondary,
  reversed,
}: {
  theme: Theme;
  title: string;
  primary: { label: string; onClick: () => void };
  secondary: { label: string; onClick: () => void };
  reversed?: boolean;
}) {
  const isLight = theme === "light";
  const headerOpp = isLight
    ? "bg-[#0D1117] text-white border-zinc-900"
    : "bg-white text-black border-white";
  const shellTone = isLight
    ? "bg-white border-zinc-300"
    : "bg-[#0D1117] border-zinc-700";

  const Btn = ({
    label,
    onClick,
    accent = "#8E2434",
  }: {
    label: string;
    onClick: () => void;
    accent?: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      className={[
        "btn-ik inline-flex items-center gap-2 px-4 h-10 rounded-xl border",
        isLight
          ? "bg-white text-zinc-900 border-zinc-300 hover:bg-zinc-100"
          : "bg-[#0D1117] text-white border-zinc-700 hover:bg-zinc-800",
      ].join(" ")}
      style={
        {
          ["--btn-ik-accent"]: accent,
          ["--btn-ik-text"]: accent,
        } as React.CSSProperties
      }
    >
      <IconMark size="xs" borderWidth={2}>
        <Check />
      </IconMark>
      {label}
    </button>
  );

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-[2px] grid place-items-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className={[
          "w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden",
          shellTone,
        ].join(" ")}
      >
        <div className={["px-5 pt-4 pb-3", headerOpp].join(" ")}>
          <h3 className="text-base font-semibold">{title}</h3>
        </div>

        <div className="px-5 py-4">
          <div
            className={[
              "flex items-center justify-center gap-3",
              reversed ? "flex-row-reverse" : "",
            ].join(" ")}
          >
            <Btn label={secondary.label} onClick={secondary.onClick} />
            <Btn
              label={primary.label}
              onClick={primary.onClick}
              accent="#8E2434"
            />
          </div>
        </div>
      </div>
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
