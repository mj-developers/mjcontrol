// src/app/(app)/users/page.tsx
"use client";

import * as React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  UserPlus,
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
import MJSpinner from "@/components/ui/MJSpinner";

/* --------------------------- Tipos & helpers --------------------------- */

type RoleItem = { id: string; code: string; name: string };

type UserListItem = {
  id: number;
  login: string;
  firstName: string;
  lastName: string;
  email: string;
  roleId?: string;
  roleCode?: string;
  roleName: string;
};

type UserInfo = {
  id: number;
  login: string;
  email: string;
  firstName: string;
  lastName: string;
  roleId?: string;
  roleName?: string;
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

const USERS_ACCENT = "#06B6D4";
const ACC_CREATE = "#10B981";
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

/* ========================= Helpers de parseo ========================= */

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}
function pickNum(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  const n = Number(v ?? NaN);
  return Number.isFinite(n) ? n : fallback;
}
function pickStr(v: unknown): string {
  return typeof v === "string" ? v : String(v ?? "").trim();
}
function pickFiniteNum(v: unknown): number | undefined {
  const n = typeof v === "number" ? v : Number(v ?? NaN);
  return Number.isFinite(n) ? n : undefined;
}

/** Normaliza status que venga de la API a 1 (activo) o 2 (inactivo) */
function readStatus(d: Record<string, unknown>): 1 | 2 {
  const cs = isObj(d["clientStatus"])
    ? (d["clientStatus"] as Record<string, unknown>)
    : null;
  const cs2 = isObj(d["client_status"])
    ? (d["client_status"] as Record<string, unknown>)
    : null;

  const nested =
    (cs ? pickFiniteNum(cs["id"]) : undefined) ??
    (cs2 ? pickFiniteNum(cs2["id"]) : undefined) ??
    pickFiniteNum(d["client_status_id"]) ??
    pickFiniteNum(d["status_id"]);

  if (nested === 1 || nested === 2) return nested as 1 | 2;

  const statusNum = pickFiniteNum(d["status"]);
  if (statusNum === 1 || statusNum === 2) return statusNum as 1 | 2;

  if (typeof d["status"] === "boolean") {
    return d["status"] ? 1 : 2;
  }

  const s = String(d["status"] ?? "").toLowerCase();
  if (["1", "true", "active", "activo"].includes(s)) return 1;
  if (
    ["2", "false", "inactive", "inactivo", "suspended", "suspendido"].includes(
      s
    )
  )
    return 2;

  return 2;
}

function extractArray(root: unknown): unknown[] {
  if (Array.isArray(root)) return root as unknown[];
  if (isObj(root)) {
    const r = root as Record<string, unknown>;
    if (Array.isArray(r.data)) return r.data as unknown[];
    if (Array.isArray(r.users)) return r.users as unknown[];
    if (Array.isArray(r.items)) return r.items as unknown[];
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

/* ------------------------------ API: roles ------------------------------ */

async function fetchRoles(): Promise<RoleItem[]> {
  const url = `/api/zaux/zaux_user_roles/list${buildQS({ limit: 1000 })}`;
  const res = await fetch(url, { cache: "no-store" });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }

  const arr = extractArray(payload);
  const out: RoleItem[] = [];

  for (const it of arr) {
    if (!isObj(it)) continue;
    const o = it as Record<string, unknown>;

    const idRaw =
      o.id ?? o.role_id ?? o.roleId ?? o.ID ?? o.Id ?? o.uid ?? null;
    const idStr = String(idRaw ?? "").trim();
    const idNum = Number(idStr);
    if (!Number.isFinite(idNum)) continue;

    const code = pickStr(o.code ?? o.Code ?? "");
    const name = pickStr(o.name ?? o.Name ?? (code || idStr));
    out.push({ id: String(idNum), code, name });
  }

  // dedupe
  const seen = new Set<string>();
  return out.filter((r) => (seen.has(r.id) ? false : (seen.add(r.id), true)));
}

/* ------------------------------ API: usuarios (paginado) ------------------------------ */

type UsersQuery = {
  q: string;
  page: number;
  pageSize: number;
  roleIds: string[] | null;
};

async function fetchUsersPage({
  q,
  page,
  pageSize,
  roleIds,
}: UsersQuery): Promise<{ items: UserListItem[]; total: number }> {
  const offset = Math.max(0, (page - 1) * pageSize);

  const qsObj: Record<string, string | number | undefined> = {
    q,
    offset,
    limit: pageSize,
    roleIds: roleIds && roleIds.length > 0 ? roleIds.join(",") : undefined,
  };

  const res = await fetch(`/api/users/list${buildQS(qsObj)}`, {
    cache: "no-store",
  });

  let root: unknown = null;
  try {
    root = await res.json();
  } catch {}

  const arr = extractArray(root);
  const totalFromApi = extractTotal(root);

  let itemsAll: UserListItem[] = [];
  for (const it of arr) {
    if (!isObj(it)) continue;
    const o = it as Record<string, unknown>;

    const id = pickNum(
      o.id ?? o.userId ?? o.ID ?? o.Id ?? o.UserId ?? o.uid,
      NaN
    );
    const login = pickStr(
      o.login ?? o.username ?? o.user ?? o.name ?? o.loginName
    );
    const firstName = pickStr(o.firstName ?? o.FirstName ?? o.name);
    const lastName = pickStr(o.lastName ?? o.LastName ?? o.surname);
    const email = pickStr(o.email ?? o.Email);

    const roleObj = isObj(o.role) ? (o.role as Record<string, unknown>) : null;
    const roleId = pickStr(
      roleObj?.id ?? o.roleId ?? o.RoleId ?? o.role_id ?? ""
    );
    const roleCode = pickStr(roleObj?.code ?? o.roleCode ?? o.RoleCode ?? "");
    const roleName = pickStr(
      roleObj?.name ?? roleObj?.Name ?? o.roleName ?? o.RoleName ?? ""
    );

    if (Number.isFinite(id) && login) {
      itemsAll.push({
        id,
        login,
        firstName,
        lastName,
        email,
        roleId: roleId || undefined,
        roleCode: roleCode || undefined,
        roleName,
      });
    }
  }

  const qNorm = q.trim().toLowerCase();
  if (qNorm) {
    itemsAll = itemsAll.filter((u) =>
      [u.login, u.email, u.firstName, u.lastName].some((s) =>
        (s || "").toLowerCase().includes(qNorm)
      )
    );
  }

  if (roleIds && roleIds.length > 0) {
    itemsAll = itemsAll.filter((u) =>
      u.roleId ? roleIds.includes(String(u.roleId)) : false
    );
  }

  const items =
    itemsAll.length > pageSize || offset > 0
      ? itemsAll.slice(offset, offset + pageSize)
      : itemsAll;

  const total = Number.isFinite(totalFromApi) ? totalFromApi : itemsAll.length;

  return { items, total };
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

export default function UsersPage() {
  const theme = useReactiveTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const availH = useAppContentInnerHeight(10);
  const isMobilePortrait = useIsMobilePortrait();

  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const [rolesList, setRolesList] = useState<RoleItem[]>([]);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[] | null>(null); // null = TODOS
  const rolesFilterKey = useMemo(
    () =>
      selectedRoleIds === null
        ? "ALL"
        : selectedRoleIds.slice().sort().join(","),
    [selectedRoleIds]
  );

  const rolesById = useMemo(() => {
    const m = new Map<string, string>();
    rolesList.forEach((r) => m.set(r.id, r.name));
    return m;
  }, [rolesList]);
  const rolesByCode = useMemo(() => {
    const m = new Map<string, string>();
    rolesList.forEach((r) => r.code && m.set(r.code, r.name));
    return m;
  }, [rolesList]);

  const [pageSize, setPageSize] = useState<number>(25);
  const [page, setPage] = useState<number>(1);
  const [list, setList] = useState<UserListItem[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    if (!mounted) return;
    let alive = true;
    (async () => {
      try {
        const rs = await fetchRoles();
        if (alive) setRolesList(rs);
      } catch {
        if (alive) setRolesList([]);
      }
    })();
    return () => {
      alive = false;
    };
  }, [mounted]);

  useEffect(() => {
    setPage(1);
  }, [search, pageSize, rolesFilterKey]);

  useEffect(() => {
    if (!mounted) return;
    let alive = true;
    setLoading(true);

    const activeRoleIds =
      selectedRoleIds &&
      selectedRoleIds.length > 0 &&
      selectedRoleIds.length < rolesList.length
        ? selectedRoleIds
        : null;

    (async () => {
      try {
        const { items, total } = await fetchUsersPage({
          q: search.trim(),
          page,
          pageSize,
          roleIds: activeRoleIds,
        });

        const mapped = items.map((u) => {
          const finalName =
            u.roleName ||
            (u.roleId ? rolesById.get(String(u.roleId)) : undefined) ||
            (u.roleCode ? rolesByCode.get(u.roleCode) : undefined) ||
            "";
          return { ...u, roleName: finalName };
        });

        if (alive) {
          setList(mapped);
          setTotalCount(total);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [
    mounted,
    search,
    page,
    pageSize,
    rolesFilterKey,
    rolesById,
    rolesByCode,
    rolesList.length,
    reloadToken,
    selectedRoleIds,
  ]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((totalCount || 0) / pageSize)),
    [totalCount, pageSize]
  );

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages));
  }, [totalPages]);

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

  const [actionsOpen, setActionsOpen] = useState(false);
  const actionsBtnRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!actionsOpen) return;
      const target = e.target as Node;
      if (
        actionsBtnRef.current &&
        !actionsBtnRef.current.contains(target) &&
        !(
          document.getElementById("users-actions-menu")?.contains(target) ??
          false
        )
      ) {
        setActionsOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [actionsOpen]);

  // Modales
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  if (!mounted) return <div className="p-6" />;

  return (
    <div
      className="users-scope flex flex-col overflow-hidden p-4 md:p-6"
      style={
        {
          ["--accent"]: USERS_ACCENT,
          height: availH != null ? `${availH}px` : undefined,
        } as WithAccentVar
      }
    >
      <style jsx global>{`
        .users-scope {
          font-family: var(--font-heading, Sora, ui-sans-serif);
        }
        .users-scope input,
        .users-scope button,
        .users-scope textarea,
        .users-scope select {
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
        @media (max-width: 640px) and (orientation: portrait) {
          .toolbar {
            flex-wrap: wrap;
          }
          .toolbar .tb-roles {
            order: 1;
            flex: 1 1 auto;
          }
          .toolbar .tb-actions {
            order: 1;
            flex: 0 0 auto;
          }
          .toolbar .tb-search {
            order: 2;
            width: 100%;
            flex: 0 0 100%;
            margin-top: 0.5rem;
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

        .users-scope {
          padding-bottom: 16px;
        }
        @media (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {
          .users-scope {
            padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 32px);
          }
        }
        @media (max-width: 1024px) and (orientation: landscape) {
          .users-scope {
            padding-top: 0px;
            padding-bottom: 0px;
          }
        }
        @media (max-width: 640px) and (orientation: portrait) {
          .users-scope {
            padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 64px);
          }
        }

        @media (orientation: landscape) and (max-height: 480px) {
          .users-scope .userdrawer {
            max-width: clamp(44rem, 92vw, 62rem);
          }
          .users-scope .userdrawer-form-area {
            display: grid !important;
            align-content: center !important;
            justify-items: stretch !important;
            gap: 0 !important;
          }
          .users-scope .userdrawer-grid {
            display: grid !important;
            grid-template-columns: 240px minmax(0, 1fr) !important;
            gap: 1rem 1.25rem !important;
            align-items: center !important;
            width: 100%;
          }
          .users-scope .userdrawer-avatar {
            width: 200px !important;
            height: 200px !important;
            border-radius: 9999px !important;
          }
          .users-scope .userdrawer-fields {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
        }

        .users-scope .table-grid {
          display: grid;
          align-items: center;
          grid-template-columns: minmax(0, 1fr) 72px;
          column-gap: 0.5rem;
        }
        .users-scope .col-first,
        .users-scope .col-last,
        .users-scope .col-email,
        .users-scope .col-role {
          display: none;
        }
        .users-scope .table-head > div {
          text-align: center;
        }

        @media (orientation: landscape) and (max-height: 480px) {
          .users-scope .table-grid {
            grid-template-columns: minmax(0, 0.9fr) 160px 200px 56px;
            column-gap: 0.75rem;
          }
          .users-scope .col-first,
          .users-scope .col-last {
            display: block;
          }
        }
        @media (min-width: 768px) and (max-width: 1024px) and (orientation: portrait) {
          .users-scope .table-grid {
            grid-template-columns: minmax(0, 1fr) 160px 200px 56px;
            column-gap: 0.75rem;
          }
          .users-scope .col-first,
          .users-scope .col-last {
            display: block;
          }
        }
        @media (max-width: 1024px) and (orientation: landscape) and (min-height: 481px) {
          .users-scope .table-grid {
            grid-template-columns:
              minmax(180px, 0.9fr) 160px 200px minmax(220px, 1.1fr)
              140px 56px;
            column-gap: 0.75rem;
          }
          .users-scope .col-first,
          .users-scope .col-last,
          .users-scope .col-email,
          .users-scope .col-role {
            display: block;
          }
        }
        @media (min-width: 1025px) {
          .users-scope .table-grid {
            grid-template-columns:
              minmax(200px, 0.8fr) 170px minmax(180px, 0.9fr)
              minmax(240px, 1.1fr) 160px 56px;
            column-gap: 0.75rem;
          }
          .users-scope .col-first,
          .users-scope .col-last,
          .users-scope .col-email,
          .users-scope .col-role {
            display: block;
          }
        }
        .users-scope .table-scroll {
          overflow-y: auto;
          overflow-x: hidden;
        }
      `}</style>

      {/* Header */}
      <header className="mb-4 md:mb-6">
        <Heading
          level={1}
          fill="solid"
          color="var(--accent, var(--brand, #8E2434))"
          fontFamily="var(--font-heading, Sora, ui-sans-serif)"
          shadow="soft+brand"
          size="clamp(1.6rem,3.2vw,2.4rem)"
          className="uppercase tracking-widest"
        >
          Usuarios
        </Heading>
        <p className={`mt-3 text-sm ${subtleText} hide-on-compact`}>
          Gestión de usuarios del sistema: busca y filtra, crea nuevos
          registros, edita información básica y elimina cuando sea necesario.
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
              placeholder="Buscar usuario…"
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

          {/* Roles */}
          <div className="tb-roles">
            <RoleDropdown
              theme={theme}
              roles={rolesList}
              selected={selectedRoleIds}
              setSelected={setSelectedRoleIds}
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
                id="users-actions-menu"
                className={[
                  "absolute right-0 mt-2 w-48 rounded-xl border shadow-md overflow-hidden z-30",
                  theme === "light"
                    ? "bg-white border-zinc-200"
                    : "bg-[#0D1117] border-zinc-700",
                ].join(" ")}
              >
                {/* NUEVO USUARIO */}
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
                    } as WithToolbarVars
                  }
                  onClick={() => {
                    setActionsOpen(false);
                    setCreateOpen(true);
                  }}
                >
                  <IconMark size="xs" borderWidth={2} style={iconMarkBase}>
                    <UserPlus />
                  </IconMark>
                  Nuevo usuario
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
                  >
                    <IconMark size="xs" borderWidth={2} style={iconMarkBase}>
                      <Edit3 />
                    </IconMark>
                    {label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Botón "Nuevo usuario" */}
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="tb-new btn-ik inline-flex items-center gap-2 px-3 h-9 rounded-xl border"
            style={
              {
                ["--btn-ik-accent"]: ACC_CREATE,
                ["--btn-ik-text"]: ACC_CREATE,
              } as WithToolbarVars
            }
          >
            <IconMark size="xs" borderWidth={2} style={iconMarkBase}>
              <UserPlus />
            </IconMark>
            Nuevo usuario
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
          <div className="col-first text-xs font-semibold opacity-80">
            Nombre
          </div>
          <div className="col-last text-xs font-semibold opacity-80">
            Apellidos
          </div>
          <div className="col-email text-xs font-semibold opacity-80">
            Email
          </div>
          <div className="col-role text-xs font-semibold opacity-80">Rol</div>
          <div className="text-xs font-semibold opacity-80">ID</div>
        </div>

        {/* Filas */}
        <div className="table-scroll flex-1 min-h-0 overscroll-contain relative">
          {loading && (
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <MJSpinner size={120} label="Cargando usuarios…" />
            </div>
          )}

          {!loading &&
            list.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setDetailId(u.id)}
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
                  <div className="font-medium truncate">{u.login}</div>
                </div>

                <div className="col-first text-sm truncate">
                  {u.firstName || "—"}
                </div>

                <div className="col-last text-sm truncate">
                  {u.lastName || "—"}
                </div>

                <div className="col-email text-sm truncate">
                  {u.email || "—"}
                </div>

                <div className="col-role text-sm truncate">
                  {u.roleName || "—"}
                </div>

                <div className="text-right font-semibold">{u.id}</div>
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

            <div>{totalCount} usuario(s)</div>
          </div>
        </div>
      </section>

      {/* Modales / Drawer */}
      {createOpen && (
        <CreateUserModal
          theme={theme}
          roles={rolesList}
          onClose={() => setCreateOpen(false)}
          onCreated={async () => {
            setCreateOpen(false);
            setPage(1);
            setReloadToken((t) => t + 1);
          }}
        />
      )}

      {detailId != null && (
        <UserDetailDrawer
          id={detailId}
          theme={theme}
          roles={rolesList}
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

  /* ======================= Dropdown: Roles ======================= */

  function RoleDropdown({
    theme,
    roles,
    selected,
    setSelected,
  }: {
    theme: Theme;
    roles: RoleItem[];
    selected: string[] | null;
    setSelected: React.Dispatch<React.SetStateAction<string[] | null>>;
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

    const allSelected =
      selected === null ||
      selected.length === 0 ||
      selected.length === roles.length;

    const toggleOne = (id: string) => {
      setSelected((prev) => {
        if (prev === null) {
          return roles.map((r) => r.id).filter((x) => x !== id);
        }
        return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      });
    };

    const toggleAll = () =>
      setSelected((prev) =>
        prev === null || (Array.isArray(prev) && prev.length === roles.length)
          ? ([] as string[])
          : roles.map((r) => r.id)
      );

    const pillTone = isLight
      ? "bg-white border-zinc-300"
      : "bg-[#0D1117] border-zinc-700";
    const pillHover = isLight
      ? "hover:bg-zinc-100"
      : "hover:bg-white/10 hover:border-zinc-500";

    return (
      <div className="relative" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className={[
            "inline-flex items-center gap-2 px-3 h-9 rounded-xl border text-[13.5px] font-semibold",
            pillTone,
            pillHover,
            "w-[210px] justify-between",
            "transition-colors",
          ].join(" ")}
          style={{ cursor: "pointer" }}
        >
          {allSelected ? "TODOS LOS ROLES" : `ROLES (${selected!.length})`}
          <ChevronDown size={16} />
        </button>

        {open && (
          <div
            className={[
              "absolute left-0 mt-2 w-64 max-h-[60vh] overflow-auto rounded-xl border shadow-md z-30",
              isLight
                ? "bg-white border-zinc-200"
                : "bg-[#0D1117] border-zinc-700",
            ].join(" ")}
          >
            {/* Opción: todos */}
            <button
              type="button"
              onClick={toggleAll}
              className={[
                "w-full flex items-center gap-2 px-3 py-2 text-left transition-colors",
                isLight ? "hover:bg-zinc-100" : "hover:bg-white/10",
                "cursor-pointer",
              ].join(" ")}
            >
              <span
                className={[
                  "w-5 h-5 grid place-items-center rounded-md border",
                  isLight
                    ? allSelected
                      ? "bg-zinc-900 border-zinc-900 text-white"
                      : "bg-white border-zinc-300 text-white"
                    : allSelected
                    ? "bg-white border-white text-black"
                    : "bg-[#0D1117] border-zinc-600 text-[#0D1117]",
                ].join(" ")}
              >
                {allSelected && <Check size={14} />}
              </span>
              <span className="font-semibold">TODOS LOS ROLES</span>
            </button>

            {roles.map((opt) => {
              const active =
                selected === null ? true : selected.includes(opt.id);
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => toggleOne(opt.id)}
                  className={[
                    "w-full flex items-center gap-2 px-3 py-2 text-left transition-colors",
                    isLight ? "hover:bg-zinc-100" : "hover:bg-white/10",
                    "cursor-pointer",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "w-5 h-5 grid place-items-center rounded-md border",
                      isLight
                        ? active
                          ? "bg-zinc-900 border-zinc-900 text-white"
                          : "bg-white border-zinc-300 text-white"
                        : active
                        ? "bg-white border-white text-black"
                        : "bg-[#0D1117] border-zinc-600 text-[#0D1117]",
                    ].join(" ")}
                  >
                    {active && <Check size={14} />}
                  </span>
                  <span className="font-semibold">
                    {opt.name || opt.code || opt.id}
                  </span>
                </button>
              );
            })}
          </div>
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

  /* ------------------------------ API: detalle/editar/eliminar ------------------------------ */

  function toStr(v: unknown) {
    return typeof v === "string" ? v : String(v ?? "").trim();
  }

  async function fetchUserInfo(id: number): Promise<UserInfo> {
    const res = await fetch(`/api/users/getUser/${id}`, {
      method: "GET",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) throw new Error(`Error getUser ${id}: ${res.status}`);

    const d = (await res.json()) as Record<string, unknown>;

    const roleObj =
      (isObj(d["role"]) ? (d["role"] as Record<string, unknown>) : undefined) ??
      ({} as Record<string, unknown>);

    const roleId =
      toStr(
        roleObj["id"] ??
          d["roleId"] ??
          (d as Record<string, unknown>)["role_id"] ??
          ""
      ).trim() || undefined;

    const createdAt = toStr(
      (d as Record<string, unknown>)["created_At"] ?? d["createdAt"] ?? ""
    );

    const status = readStatus(d); // 1 | 2

    return {
      id: typeof d["id"] === "number" ? (d["id"] as number) : id,
      login: toStr(d["login"]),
      email: toStr(d["email"]),
      firstName: toStr(d["firstName"]),
      lastName: toStr(d["lastName"]),
      roleId,
      roleName: toStr(roleObj["name"] ?? ""),
      status,
      createdAt,
    };
  }

  async function updateUser(
    id: number,
    payload: Partial<UserInfo> & { password?: string }
  ) {
    const roleIdNum =
      payload.roleId != null &&
      payload.roleId !== "" &&
      Number.isFinite(Number(payload.roleId))
        ? Number(payload.roleId)
        : undefined;

    const bodyPayload: Record<string, unknown> = {
      id,
      login: payload.login ?? "",
      email: payload.email ?? "",
      firstName: payload.firstName ?? "",
      lastName: payload.lastName ?? "",
    };

    // status como número 1|2
    if (payload.status === 1 || payload.status === 2) {
      bodyPayload.status = payload.status;
    }

    // 🔁 Roles (dejamos como iba: objeto + id plano por compat)
    if (roleIdNum !== undefined) {
      bodyPayload.role = { id: roleIdNum, code: "", name: "" };
      bodyPayload.role_id = roleIdNum;
    }

    if (payload.password) bodyPayload.password = payload.password;

    const res = await fetch(`/api/users/update/${encodeURIComponent(id)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(bodyPayload),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(txt || `Error updateUser ${id}: ${res.status}`);
    }
  }

  async function deleteUser(id: number) {
    const res = await fetch(`/api/users/delete/${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      let msg = "";
      try {
        const body = (await res.json()) as Record<string, unknown>;
        msg = typeof body?.error === "string" ? (body.error as string) : "";
      } catch {
        /* ignore */
      }
      throw new Error(msg || `Error deleteUser ${id}: ${res.status}`);
    }
  }

  /* ============================ Modal: Crear ============================ */

  function CreateUserModal({
    theme,
    roles,
    onClose,
    onCreated,
  }: {
    theme: Theme;
    roles: RoleItem[];
    onClose: () => void;
    onCreated: () => Promise<void> | void;
  }) {
    const [login, setLogin] = useState("");
    const [pass, setPass] = useState("");
    const [email, setEmail] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [selectedRoleId, setSelectedRoleId] = useState<string>("");
    const [busy, setBusy] = useState(false);

    useEffect(() => {
      if (!selectedRoleId && roles.length > 0) {
        const byUserCode =
          roles.find((r) => /user|usuario/i.test(r.code || r.name))?.id ?? null;
        setSelectedRoleId(byUserCode ?? roles[0].id);
      }
    }, [roles, selectedRoleId]);

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
      const user = login.trim();
      if (!user || !pass || !selectedRoleId) return;

      setBusy(true);
      try {
        const payload = {
          login: user,
          password: pass,
          email: email.trim() || undefined,
          firstName: firstName.trim() || undefined,
          lastName: lastName.trim() || undefined,
          status: 1,
          role_id: Number(selectedRoleId),
        };

        const res = await fetch("/api/users/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          let msg = "";
          try {
            const body = await res.json();
            msg = typeof body?.error === "string" ? body.error : "";
          } catch {}
          throw new Error(msg || "Error creando usuario");
        }

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
            "create-modal relative w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden",
            isLight
              ? "bg-white border-zinc-300"
              : "bg-[#0D1117] border-zinc-700",
          ].join(" ")}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* SPINNER: crear usuario */}
          {busy && <MJSpinner overlay size={110} label="Creando usuario…" />}

          <div
            className={[
              "flex items-center justify-between px-5 pt-4 pb-3",
              headerOpp,
            ].join(" ")}
          >
            <h2 className="text-lg font-semibold">Crear usuario</h2>
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

          {/* Anti-autocompletar a nivel de form */}
          <form
            className="px-5 pb-5 pt-4"
            onSubmit={submit}
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore="true"
          >
            {/* Avatar */}
            <div className="flex justify-center my-2">
              <div
                className={[
                  "w-36 h-36 md:w-40 md:h-40 rounded-full border grid place-items-center",
                  isLight
                    ? "border-zinc-400 bg-white"
                    : "border-zinc-600 bg-[#0D1117]",
                ].join(" ")}
              />
            </div>

            {/* Campos */}
            <div className="grid gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="block text-sm mb-1 opacity-80">
                    Usuario *
                  </span>
                  <input
                    value={login}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLogin(e.target.value)
                    }
                    placeholder="Usuario"
                    name="new-username"
                    autoComplete="off"
                    spellCheck={false}
                    autoCorrect="off"
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
                    Contraseña *
                  </span>
                  <input
                    value={pass}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setPass(e.target.value)
                    }
                    placeholder="••••••"
                    type="password"
                    name="new-password"
                    autoComplete="new-password"
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
              </div>

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

              <div className="grid gap-3 md:grid-cols-2">
                <label className="block">
                  <span className="block text-sm mb-1 opacity-80">Nombre</span>
                  <input
                    value={firstName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFirstName(e.target.value)
                    }
                    placeholder="Nombre"
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

                <label className="block">
                  <span className="block text-sm mb-1 opacity-80">
                    Apellidos
                  </span>
                  <input
                    value={lastName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLastName(e.target.value)
                    }
                    placeholder="Apellidos"
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

              {/* Selector de rol (obligatorio) */}
              <label className="block">
                <span className="block text-sm mb-1 opacity-80">Rol *</span>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className={[
                    "w-full h-11 rounded-xl px-3 border outline-none text-[15px]",
                    isLight
                      ? "bg-[#F6F8FA] border-zinc-300 text-zinc-900"
                      : "bg-[#0D1117] border-zinc-700 text-white",
                    "focus:ring-2 focus:ring-[var(--brand,#8E2434)]/30",
                  ].join(" ")}
                >
                  {roles.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name || r.code || r.id}
                    </option>
                  ))}
                </select>
              </label>
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
                <IconMark size="xs" borderWidth={2} style={markBase}>
                  <X />
                </IconMark>
                Cancelar
              </button>

              <button
                type="submit"
                disabled={busy || !login.trim() || !pass || !selectedRoleId}
                className={[
                  "btn-ik inline-flex items-center gap-2 px-4 h-10 rounded-xl border",
                  isLight
                    ? "bg-white text-zinc-900 border-zinc-300 hover:bg-zinc-100"
                    : "bg-[#0D1117] text-white border-zinc-700 hover:bg-zinc-800",
                  busy || !login.trim() || !pass || !selectedRoleId
                    ? "opacity-60 pointer-events-none"
                    : "",
                ].join(" ")}
                style={
                  {
                    ["--btn-ik-accent"]: ACC_CREATE,
                    ["--btn-ik-text"]: ACC_CREATE,
                  } as React.CSSProperties
                }
              >
                <IconMark size="xs" borderWidth={2} style={markBase}>
                  <UserPlus />
                </IconMark>
                Crear
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /* ====================== Drawer lateral: Detalle ====================== */

  function UserDetailDrawer({
    id,
    theme,
    roles,
    onClose,
    onDeleted,
    onSaved,
  }: {
    id: number;
    theme: Theme;
    roles: RoleItem[];
    onClose: () => void;
    onDeleted: () => Promise<void> | void;
    onSaved: () => Promise<void> | void;
  }) {
    const [info, setInfo] = React.useState<UserInfo | null>(null);
    const [busy, setBusy] = React.useState(false);
    const [busyLabel, setBusyLabel] = React.useState<string | null>(null);
    const [enter, setEnter] = React.useState(false);
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [ask1, setAsk1] = React.useState(false);
    const [ask2, setAsk2] = React.useState(false);
    const menuRef = React.useRef<HTMLDivElement | null>(null);
    const isLight = theme === "light";

    // --- Protecciones de concurrencia/Strict Mode ---
    const editedRef = React.useRef(false);
    const reqIdRef = React.useRef(0);

    const markEdited = React.useCallback(() => {
      editedRef.current = true;
    }, []);

    React.useEffect(() => {
      editedRef.current = false;
      const myReq = ++reqIdRef.current;
      let cancelled = false;

      (async () => {
        try {
          const data = await fetchUserInfo(id);
          if (!cancelled && reqIdRef.current === myReq && !editedRef.current) {
            setInfo(data);
          }
        } catch {
          if (!cancelled && reqIdRef.current === myReq && !editedRef.current) {
            setInfo({
              id,
              login: "",
              email: "",
              firstName: "",
              lastName: "",
              status: 1,
            });
          }
        }
      })();

      return () => {
        cancelled = true;
      };
    }, [id]);

    React.useEffect(() => {
      const t = setTimeout(() => setEnter(true), 10);
      return () => clearTimeout(t);
    }, []);

    React.useEffect(() => {
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
        await updateUser(info.id, {
          login: info.login,
          email: info.email,
          firstName: info.firstName,
          lastName: info.lastName,
          roleId: info.roleId,
          status: info.status,
        });
        await onSaved();
      } finally {
        setBusy(false);
        setBusyLabel(null);
      }
    }

    async function reallyDelete() {
      if (!info) return;
      setBusyLabel("Eliminando usuario…");
      setBusy(true);
      try {
        await deleteUser(info.id);
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
            "userdrawer absolute inset-y-0 right-0 left-auto h-full w-full max-w-xl border-l shadow-2xl",
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
            <h2 className="text-lg font-semibold">Detalles del usuario</h2>

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

          {/* Form */}
          <form
            id="user-detail-form"
            className="userdrawer-form-area flex-1 overflow-auto px-5 pt-4 pb-24"
            onSubmit={handleSave}
            autoComplete="off"
          >
            {!info ? null : (
              <div className="grid gap-5">
                {/* Fila superior: Avatar + Activo */}
                <div className="flex justify-center items-end gap-6 my-4 md:my-6">
                  <div
                    className={[
                      "userdrawer-avatar rounded-full border grid place-items-center",
                      "w-40 h-40 md:w-44 md:h-44",
                      isLight
                        ? "border-zinc-400 bg-white"
                        : "border-zinc-600 bg-[#0D1117]",
                    ].join(" ")}
                  />

                  {/* Checkbox Activo -> status 1/2 */}
                  <label className="inline-flex items-center gap-2 select-none text-sm">
                    <input
                      type="checkbox"
                      checked={info.status === 1}
                      onChange={(e) =>
                        setInfo((prev) =>
                          prev
                            ? {
                                ...prev,
                                status: (e.target.checked ? 1 : 2) as 1 | 2,
                              }
                            : prev
                        )
                      }
                      className={[
                        "w-4 h-4 rounded border",
                        isLight
                          ? "border-zinc-400"
                          : "border-zinc-600 bg-[#0D1117]",
                      ].join(" ")}
                    />
                    <span
                      className={isLight ? "text-zinc-800" : "text-zinc-200"}
                    >
                      Activo
                    </span>
                  </label>
                </div>

                {/* Campos */}
                <div className="grid gap-3">
                  <div className="grid gap-3 md:grid-cols-2">
                    <Field
                      label="Login"
                      value={info.login}
                      onChange={(v) =>
                        setInfo((p) => (p ? { ...p, login: v } : p))
                      }
                      theme={theme}
                    />
                    <label className="block">
                      <span className="block text-sm mb-1 opacity-80">Rol</span>
                      <select
                        value={info.roleId ?? ""}
                        onChange={(e) =>
                          setInfo((p) =>
                            p ? { ...p, roleId: e.target.value } : p
                          )
                        }
                        className={[
                          "w-full h-11 rounded-xl px-3 border outline-none text-[15px]",
                          isLight
                            ? "bg-[#F6F8FA] border-zinc-300 text-zinc-900"
                            : "bg-[#0D1117] border-zinc-700 text-white",
                          "focus:ring-2 focus:ring-[var(--brand,#8E2434)]/30",
                        ].join(" ")}
                      >
                        <option value="" disabled>
                          Selecciona un rol…
                        </option>
                        {roles.map((r) => (
                          <option key={r.id} value={r.id}>
                            {r.name || r.code || r.id}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  <Field
                    label="Email"
                    value={info.email}
                    onChange={(v) =>
                      setInfo((p) => (p ? { ...p, email: v } : p))
                    }
                    theme={theme}
                  />

                  <div className="grid gap-3 md:grid-cols-2">
                    <Field
                      label="Nombre"
                      value={info.firstName}
                      onChange={(v) =>
                        setInfo((p) => (p ? { ...p, firstName: v } : p))
                      }
                      theme={theme}
                    />
                    <Field
                      label="Apellidos"
                      value={info.lastName}
                      onChange={(v) =>
                        setInfo((p) => (p ? { ...p, lastName: v } : p))
                      }
                      theme={theme}
                    />
                  </div>
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
                form="user-detail-form"
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
                    ["--btn-ik-accent"]: "#6366F1",
                    ["--btn-ik-text"]: "#6366F1",
                  } as React.CSSProperties
                }
              >
                <IconMark size="xs" borderWidth={2} style={markBase}>
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
            title="Se va a eliminar el usuario, ¿está seguro?"
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
            title={`Esta acción es irreversible, ¿seguro de querer eliminar el usuario "${info.login}"?`}
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

  /* ------- Pequeño modal reutilizable de confirmación (mismo estilo) ------- */
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

    const markBase = {
      ["--mark-bg"]: isLight ? "#e2e5ea" : "#0b0b0d",
      ["--mark-border"]: isLight ? "#0e1117" : "#ffffff",
      ["--mark-fg"]: isLight ? "#010409" : "#ffffff",
    } as React.CSSProperties;

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
        <IconMark size="xs" borderWidth={2} style={markBase}>
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
}
