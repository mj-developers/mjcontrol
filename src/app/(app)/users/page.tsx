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
  // Vars que hereda IconMark para el hover
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

/* ------------------------------ Mock API ------------------------------ */

/* ------------------------------ API: lista ------------------------------ */

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

async function fetchUsers(): Promise<UserListItem[]> {
  try {
    const res = await fetch("/api/users/list", { cache: "no-store" });
    if (!res.ok) return [];

    const json: unknown = await res.json();

    // Acepta formatos: [], { users: [] }, { data: [] }
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

async function fetchUserInfo(id: number): Promise<UserInfo> {
  return {
    id,
    login: `user.${id}`,
    email: `user${id}@acme.test`,
    firstName: "Nombre",
    lastName: `#${id}`,
  };
}
async function updateUser(id: number, payload: Partial<UserInfo>) {
  void id;
  void payload;
  await new Promise((r) => setTimeout(r, 400));
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

  // Filtro texto (roles mock visual)
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
          transition: border-color 0.15s ease, color 0.15s ease,
            background-color 0.15s ease;
        }
        .btn-ik:hover {
          color: var(--btn-ik-text, inherit);
          border-color: var(--btn-ik-accent, currentColor);
        }

        /* === Hover del IconMark: toma el acento del propio botón === */
        .btn-ik:hover .mj-iconmark {
          --mark-bg: var(--btn-ik-accent) !important;
          --mark-border: var(--btn-ik-accent) !important;
          --mark-fg: #ffffff !important;
        }
        .btn-ik:focus-visible .mj-iconmark {
          --mark-bg: var(--btn-ik-accent) !important;
          --mark-border: var(--btn-ik-accent) !important;
          --mark-fg: #ffffff !important;
        }
        /* Mantén la animación "zoom" que ya usabas */
        .btn-ik:hover .mj-iconmark[data-anim="zoom"] .icon-default {
          transform: scale(1.5) !important;
        }
        .btn-ik:hover .mj-iconmark[data-anim="zoom"] .icon-hover {
          transform: scale(1) !important;
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
        <p className={`mt-3 text-sm ${subtleText}`}>
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
        <div className="flex flex-wrap items-center gap-3">
          {/* Buscador */}
          <div className="relative flex-1 min-w-[240px]">
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
          <RoleDropdown theme={theme} roles={roles} setRoles={setRoles} />

          {/* Acciones */}
          <div className="relative">
            <button
              ref={actionsBtnRef}
              type="button"
              onClick={() => setActionsOpen((v) => !v)}
              className="btn-ik inline-flex items-center gap-2 px-3 h-9 rounded-xl border"
              style={
                {
                  ["--btn-ik-accent"]: ACC_ACTIONS,
                  ["--btn-ik-text"]: ACC_ACTIONS,
                  // Para que el IconMark herede el color de hover
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
              Acciones
              <ChevronDown size={16} />
            </button>

            {actionsOpen && (
              <div
                id="users-actions-menu"
                className={[
                  "absolute right-0 mt-2 w-44 rounded-xl border shadow-md overflow-hidden z-30",
                  theme === "light"
                    ? "bg-white border-zinc-200"
                    : "bg-[#0D1117] border-zinc-700",
                ].join(" ")}
              >
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

          {/* Nuevo usuario */}
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="btn-ik inline-flex items-center gap-2 px-3 h-9 rounded-xl border"
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
        {/* Filas */}
        <div className="flex-1 min-h-0 overflow-auto overscroll-contain">
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
                    : "hover:bg-white/10 border-zinc-800", // ⬅️ antes: hover:bg-zinc-900/40
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
            {/* Page size */}
            <PageSizeDropdown
              theme={theme}
              value={pageSize}
              onChange={(v) => setPageSize(v)}
            />

            {/* Paginación compacta */}
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

            <div>{filtered.length} usuario(s)</div>
          </div>
        </div>
      </section>

      {/* Modales */}
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
        <UserDetailModal
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
  roles: Role[] | null; // null = todos
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

  // Si estaba marcado (todos o 3) -> ninguno ([]). Si no -> marca todos (3).
  const toggleAll = () =>
    setRoles((prev) =>
      prev === null || (Array.isArray(prev) && prev.length === 3)
        ? ([] as Role[])
        : (["r1", "r2", "r3"] as Role[])
    );

  const pillTone = isLight
    ? "bg-white border-zinc-300"
    : "bg-[#0D1117] border-zinc-700";
  // ⬇️ hover más visible en dark
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
          "transition-colors", // suaviza el cambio
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
        // drop-up para no ser recortado por el contenedor
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
          className="flex items-center justify-between px-5 pt-4 pb-3 rounded-t-2xl"
          style={{ background: ACC_CREATE, color: "#fff" }}
        >
          <h2 className="text-lg font-semibold">Crear usuario</h2>
          <button
            type="button"
            className="text-white/90 hover:text-white"
            onClick={onClose}
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
                "px-4 h-10 rounded-xl border",
                isLight
                  ? "bg-white text-zinc-900 border-zinc-300 hover:bg-zinc-100"
                  : "bg-[#0D1117] text-white border-zinc-700 hover:bg-zinc-800",
              ].join(" ")}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={busy || !login.trim() || !pass}
              className={[
                "px-4 h-10 rounded-xl border text-white",
                busy || !login.trim() || !pass
                  ? "opacity-60 pointer-events-none"
                  : "",
              ].join(" ")}
              style={{ background: ACC_CREATE, borderColor: ACC_CREATE }}
            >
              Crear
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================ Modal: Detalle ============================ */

function UserDetailModal({
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
  const isLight = theme === "light";

  useEffect(() => {
    (async () => {
      const data = await fetchUserInfo(id);
      setInfo(data);
    })();
  }, [id]);

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

  const markStyle = {
    ["--mark-bg"]: isLight ? "#e2e5ea" : "#0b0b0d",
    ["--mark-border"]: isLight ? "#0e1117" : "#ffffff",
    ["--mark-fg"]: isLight ? "#010409" : "#ffffff",
  } as React.CSSProperties;

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] grid place-items-center p-4"
      onMouseDown={onClose}
    >
      <div
        className={[
          "relative w-full max-w-xl rounded-2xl border shadow-2xl overflow-hidden",
          isLight ? "bg-white border-zinc-300" : "bg-[#0D1117] border-zinc-700",
        ].join(" ")}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          className={[
            "flex items-center justify-between px-5 pt-4 pb-3 rounded-t-2xl",
            isLight ? "bg-[#E7EBF1]" : "bg-[#131821]",
          ].join(" ")}
        >
          <h2 className="text-lg font-semibold">Detalles del usuario</h2>
          <button
            type="button"
            className="opacity-80 hover:opacity-100"
            onClick={onClose}
          >
            <X />
          </button>
        </div>

        <form className="px-5 pb-5 pt-4 space-y-4" onSubmit={handleSave}>
          {!info ? (
            <p className="opacity-80 text-sm">Cargando…</p>
          ) : (
            <>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={busy}
                  className={[
                    "btn-ik inline-flex items-center gap-2 px-4 h-10 rounded-xl border",
                    isLight
                      ? "bg-white text-zinc-900 border-zinc-300 hover:bg-zinc-100"
                      : "bg-[#0D1117] text-white border-zinc-700 hover:bg-zinc-800",
                    busy && "opacity-60 pointer-events-none",
                  ].join(" ")}
                  style={{ ["--btn-ik-accent"]: "#8E2434" } as WithToolbarVars}
                >
                  <IconMark
                    size="xs"
                    borderWidth={2}
                    interactive
                    hoverAnim="zoom"
                    zoomScale={1.5}
                    style={markStyle}
                  >
                    <Trash2 />
                  </IconMark>
                  Eliminar
                </button>

                <button
                  type="submit"
                  disabled={busy}
                  className={[
                    "btn-ik inline-flex items-center gap-2 px-4 h-10 rounded-xl border",
                    isLight
                      ? "bg-white text-zinc-900 border-zinc-300 hover:bg-zinc-100"
                      : "bg-[#0D1117] text-white border-zinc-700 hover:bg-zinc-800",
                    busy && "opacity-60 pointer-events-none",
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
                    style={markStyle}
                  >
                    <Save />
                  </IconMark>
                  Guardar
                </button>
              </div>
            </>
          )}
        </form>
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
