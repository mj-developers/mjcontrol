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

/* --------------------------- Tipos & helpers --------------------------- */

type UserListItem = { id: number; login: string };

type UserInfo = {
  id: number;
  login: string;
  email: string;
  firstName: string;
  lastName: string;
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

type Role = "r1" | "r2" | "r3";

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

/* ------------------------------ API: lista ------------------------------ */

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

async function fetchUsers(): Promise<UserListItem[]> {
  try {
    const res = await fetch("/api/users/list", { cache: "no-store" });
    if (!res.ok) return [];

    const json: unknown = await res.json();

    let arr: unknown[] = [];
    if (Array.isArray(json)) {
      arr = json;
    } else if (isObj(json)) {
      const rec = json as Record<string, unknown>;
      if (Array.isArray(rec["users"])) arr = rec["users"] as unknown[];
      else if (Array.isArray(rec["data"])) arr = rec["data"] as unknown[];
    }

    const out: UserListItem[] = [];
    for (const it of arr) {
      if (!isObj(it)) continue;
      const o = it as Record<string, unknown>;
      const idRaw =
        o["id"] ?? o["userId"] ?? o["ID"] ?? o["Id"] ?? o["UserId"] ?? o["uid"];
      const id =
        typeof idRaw === "number" ? idRaw : Number(idRaw != null ? idRaw : NaN);
      const loginRaw =
        o["login"] ?? o["username"] ?? o["user"] ?? o["name"] ?? o["loginName"];
      const login =
        typeof loginRaw === "string" ? loginRaw : String(loginRaw ?? "").trim();
      if (Number.isFinite(id) && login) out.push({ id, login });
    }
    return out;
  } catch {
    return [];
  }
}

/* ------------------------------ API: detalle ------------------------------ */

async function fetchUserInfo(id: number): Promise<UserInfo> {
  const res = await fetch(`/api/users/getUser/${id}`, {
    method: "GET",
    cache: "no-store",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error(`Error getUser ${id}: ${res.status}`);

  const data = (await res.json()) as Partial<UserInfo> & { id?: number };

  return {
    id: typeof data.id === "number" ? data.id : id,
    login: String(data.login ?? ""),
    email: String(data.email ?? ""),
    firstName: String(data.firstName ?? ""),
    lastName: String(data.lastName ?? ""),
  };
}

async function updateUser(id: number, payload: Partial<UserInfo>) {
  const res = await fetch(`/api/users/update/${encodeURIComponent(id)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      login: payload.login ?? "",
      email: payload.email ?? "",
      firstName: payload.firstName ?? "",
      lastName: payload.lastName ?? "",
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      (body && (body.error as string)) ||
        `Error updateUser ${id}: ${res.status}`
    );
  }
}

async function deleteUser(id: number) {
  void id;
  await new Promise((r) => setTimeout(r, 400));
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

  // Estado
  const [search, setSearch] = useState("");
  const [list, setList] = useState<UserListItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Roles: null = TODOS, [] = ninguno, subset = algunos
  const [roles, setRoles] = useState<Role[] | null>(null);
  const rolesKey = useMemo(
    () => (roles === null ? "ALL" : roles.slice().sort().join(",")),
    [roles]
  );

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
        const data = await fetchUsers();
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

  useEffect(() => {
    setPage(1);
  }, [search, pageSize, rolesKey]);

  // Cerrar Acciones al click fuera
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
  } as React.CSSProperties;

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
      {/* ====== estilos scope ====== */}
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

        /* ===== Espacio inferior por breakpoint ===== */
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

        /* ===== SOLO MÓVIL LANDSCAPE =====
           Usamos (orientation: landscape) + (max-height: 480px) para
           discriminar teléfonos en apaisado sin tocar tablets */
        @media (orientation: landscape) and (max-height: 480px) {
          /* Drawer más ancho */
          .users-scope .userdrawer {
            max-width: clamp(
              44rem,
              92vw,
              62rem
            ); /* más ancho, sin salir de la pantalla */
          }

          /* Área del formulario: ocupar todo el alto disponible y centrar verticalmente */
          .users-scope .userdrawer-form-area {
            display: grid !important;
            align-content: center !important; /* centra en vertical */
            justify-items: stretch !important;
            gap: 0 !important;
          }

          /* Disposición en 2 columnas: avatar izquierda (fija) + contenido derecha */
          .users-scope .userdrawer-grid {
            display: grid !important;
            grid-template-columns: 240px minmax(0, 1fr) !important;
            gap: 1rem 1.25rem !important;
            align-items: center !important;
            width: 100%;
          }

          /* Avatar siempre círculo y tamaño consistente */
          .users-scope .userdrawer-avatar {
            width: 200px !important;
            height: 200px !important;
            border-radius: 9999px !important;
          }

          /* En la columna derecha, los campos uno por línea */
          .users-scope .userdrawer-fields {
            display: grid !important;
            grid-template-columns: 1fr !important;
            gap: 0.75rem !important;
          }
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
            <RoleDropdown theme={theme} roles={roles} setRoles={setRoles} />
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
                id="users-actions-menu"
                className={[
                  "absolute right-0 mt-2 w-48 rounded-xl border shadow-md overflow-hidden z-30",
                  theme === "light"
                    ? "bg-white border-zinc-200"
                    : "bg-[#0D1117] border-zinc-700",
                ].join(" ")}
              >
                {/* NUEVO USUARIO (solo vistas compactas) */}
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

          {/* Botón suelto "Nuevo usuario" */}
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
            "grid grid-cols-[auto_1fr_72px] items-center px-4 py-2 border-b",
            headerTone,
          ].join(" ")}
        >
          <div className="text-xs font-semibold opacity-80">Login</div>
          <div className="text-xs font-semibold opacity-80 text-right pr-2">
            ID
          </div>
          <div className="text-xs font-semibold opacity-80 text-right" />
        </div>

        {/* Filas */}
        <div className="flex-1 min-h-0 overflow-auto overscroll-contain">
          {loading && (
            <div className="px-4 py-3 text-sm">Cargando usuarios…</div>
          )}
          {!loading &&
            displayed.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setDetailId(u.id)}
                className={[
                  "w-full text-left grid grid-cols-[auto_1fr_72px] items-center gap-2 px-4 py-3 border-b cursor-pointer transition-colors",
                  theme === "light"
                    ? "hover:bg-zinc-50 border-zinc-100"
                    : "hover:bg-white/10 border-zinc-800",
                ].join(" ")}
              >
                <div className="col-span-2 flex items-center gap-3">
                  <div
                    className={[
                      "w-8 h-8 rounded-full border flex-none grid place-items-center text-[10px]",
                      theme === "light"
                        ? "border-zinc-400 bg-white"
                        : "border-zinc-600 bg-[#0D1117]",
                    ].join(" ")}
                  />
                  <div className="font-medium">{u.login}</div>
                </div>
                <div className="text-right font-semibold">{u.id}</div>
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

            <div>{filtered.length} usuario(s)</div>
          </div>
        </div>
      </section>

      {/* Modales / Drawer */}
      {createOpen && (
        <CreateUserModal
          theme={theme}
          onClose={() => setCreateOpen(false)}
          onCreated={async () => {
            setCreateOpen(false);
            const fresh = await fetchUsers();
            setList(fresh);
          }}
        />
      )}

      {detailId != null && (
        <UserDetailDrawer
          id={detailId}
          theme={theme}
          onClose={() => setDetailId(null)}
          onDeleted={async () => {
            setDetailId(null);
            const fresh = await fetchUsers();
            setList(fresh);
          }}
          onSaved={async () => {
            setDetailId(null);
            const fresh = await fetchUsers();
            setList(fresh);
          }}
        />
      )}
    </div>
  );
}

/* ======================= Dropdown: Roles (multi) ======================= */

function RoleDropdown({
  theme,
  roles,
  setRoles,
}: {
  theme: Theme;
  roles: Role[] | null;
  setRoles: React.Dispatch<React.SetStateAction<Role[] | null>>;
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

  const showAllLabel =
    roles === null || roles.length === 0 || roles.length === 3;

  const toggleOne = (k: Role) => {
    setRoles((prev) => {
      if (prev === null) {
        return (["r1", "r2", "r3"] as Role[]).filter((r) => r !== k);
      }
      return prev.includes(k) ? prev.filter((r) => r !== k) : [...prev, k];
    });
  };

  const toggleAll = () =>
    setRoles((prev) =>
      prev === null || (Array.isArray(prev) && prev.length === 3)
        ? ([] as Role[])
        : (["r1", "r2", "r3"] as Role[])
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
        {showAllLabel ? "TODOS LOS ROLES" : `ROLES (${roles!.length})`}
        <ChevronDown size={16} />
      </button>

      {open && (
        <div
          className={[
            "absolute left-0 mt-2 w-56 rounded-xl border shadow-md overflow-hidden z-30",
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
                  ? showAllLabel
                    ? "bg-zinc-900 border-zinc-900 text-white"
                    : "bg-white border-zinc-300 text-white"
                  : showAllLabel
                  ? "bg-white border-white text-black"
                  : "bg-[#0D1117] border-zinc-600 text-[#0D1117]",
              ].join(" ")}
            >
              {showAllLabel && <Check size={14} />}
            </span>
            <span className="font-semibold">TODOS LOS ROLES</span>
          </button>

          {(
            [
              { k: "r1", label: "Rol1" },
              { k: "r2", label: "Rol2" },
              { k: "r3", label: "Rol3" },
            ] as const
          ).map((opt) => {
            const active =
              roles === null ? true : roles.includes(opt.k as Role);
            return (
              <button
                key={opt.k}
                type="button"
                onClick={() => toggleOne(opt.k)}
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
                <span className="font-semibold">{opt.label}</span>
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

/* ============================ Modal: Crear ============================ */

function CreateUserModal({
  theme,
  onClose,
  onCreated,
}: {
  theme: Theme;
  onClose: () => void;
  onCreated: () => Promise<void> | void;
}) {
  const [login, setLogin] = useState("");
  const [pass, setPass] = useState("");
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
    if (!login.trim() || !pass) return;
    setBusy(true);
    try {
      await new Promise((r) => setTimeout(r, 600));
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
          "relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden",
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
          <h2 className="text-lg font-semibold">Crear usuario</h2>
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

        <form className="px-5 pb-5 pt-4 space-y-4" onSubmit={submit}>
          <label className="block">
            <span className="block text-sm mb-1 opacity-80">Usuario</span>
            <input
              value={login}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLogin(e.target.value)
              }
              placeholder="Login"
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
            <span className="block text-sm mb-1 opacity-80">Contraseña</span>
            <input
              value={pass}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setPass(e.target.value)
              }
              placeholder="Contraseña"
              type="password"
              className={[
                "w-full h-11 rounded-xl px-3 border outline-none",
                isLight
                  ? "bg-[#F6F8FA] border-zinc-300 text-zinc-900"
                  : "bg-[#0D1117] border-zinc-700 text-white",
                "focus:ring-2 focus:ring-[var(--brand,#8E2434)]/30",
              ].join(" ")}
            />
          </label>

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
              disabled={busy || !login.trim() || !pass}
              className={[
                "btn-ik inline-flex items-center gap-2 px-4 h-10 rounded-xl border",
                isLight
                  ? "bg-white text-zinc-900 border-zinc-300 hover:bg-zinc-100"
                  : "bg-[#0D1117] text-white border-zinc-700 hover:bg-zinc-800",
                busy || !login.trim() || !pass
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
  const [info, setInfo] = useState<UserInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [enter, setEnter] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const isLight = theme === "light";

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const data = await fetchUserInfo(id);
        if (alive) setInfo(data);
      } catch {
        if (alive)
          setInfo({ id, login: "", email: "", firstName: "", lastName: "" });
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
      await updateUser(info.id, {
        login: info.login,
        email: info.email,
        firstName: info.firstName,
        lastName: info.lastName,
      });
      await onSaved();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!info) return;
    if (!confirm(`¿Eliminar al usuario “${info.login}”?`)) return;
    setBusy(true);
    try {
      await deleteUser(info.id);
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
  } as React.CSSProperties;

  return (
    <div className="fixed inset-0 z-[60]">
      {/* Solo para móvil landscape: forzar que Nombre+Apellidos estén a dos columnas */}
      <style jsx global>{`
        @media (orientation: landscape) and (max-height: 480px) {
          .users-scope .userdrawer-row-two {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.75rem;
          }
        }
      `}</style>

      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <aside
        className={[
          "userdrawer absolute right-0 top-0 h-full w-full max-w-xl border-l shadow-2xl",
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
          <h2 className="text-lg font-semibold">Detalles del usuario</h2>

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
          id="user-detail-form"
          className="userdrawer-form-area flex-1 overflow-auto px-5 pt-4 pb-24"
          onSubmit={handleSave}
        >
          {!info ? (
            <p className="opacity-80 text-sm">Cargando…</p>
          ) : (
            <div className="userdrawer-grid">
              {/* Avatar a la izquierda (círculo) */}
              <div className="flex justify-center my-4 md:my-6">
                <div
                  className={[
                    "userdrawer-avatar rounded-full border grid place-items-center",
                    "w-40 h-40 md:w-44 md:h-44",
                    isLight
                      ? "border-zinc-400 bg-white"
                      : "border-zinc-600 bg-[#0D1117]",
                  ].join(" ")}
                />
              </div>

              {/* Campos a la derecha */}
              <div className="userdrawer-fields">
                <Field
                  label="Login"
                  value={info.login}
                  onChange={(v) => setInfo({ ...info, login: v })}
                  theme={theme}
                />
                <Field
                  label="Email"
                  value={info.email}
                  onChange={(v) => setInfo({ ...info, email: v })}
                  theme={theme}
                />

                {/* Nombre + Apellidos en la misma fila (solo móvil landscape via CSS de arriba) */}
                <div className="userdrawer-row-two">
                  <Field
                    label="Nombre"
                    value={info.firstName}
                    onChange={(v) => setInfo({ ...info, firstName: v })}
                    theme={theme}
                  />
                  <Field
                    label="Apellidos"
                    value={info.lastName}
                    onChange={(v) => setInfo({ ...info, lastName: v })}
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
