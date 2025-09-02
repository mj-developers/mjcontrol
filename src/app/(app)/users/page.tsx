// src/app/(app)/users/page.tsx
"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { Save, Trash2, Search, UserPlus, X } from "lucide-react";
import IconMark from "@/components/ui/IconMark";
import Heading from "@/components/ui/Heading";
import { getInitialTheme, type Theme } from "@/lib/theme";

/* --------------------------- Acentos / constantes -------------------------- */
const ACC_CREATE = "#10B981"; // verde crear
const ACC_SAVE = "#6366F1"; // header/confirm del modal Guardar
const ACC_DELETE = "#8E2434"; // brand burdeos (eliminar / cancelar hover)
const ZOOM = 1.5;

// Color de la sección (mismo que el icono activo del menú para "Clientes")
type AccentVars = React.CSSProperties & { ["--accent"]?: string };
const USERS_ACCENT = "#06B6D4"; // cyan-500

/* ----------------------------- Tipos de datos ----------------------------- */
type UserListItem = { id: number; login: string };
type UserInfo = {
  login: string;
  firstName: string;
  lastName: string;
  email: string;
};
type CreatePayload = { Login: string; Password: string };
type UpdatePayload = Partial<{
  Login: string;
  FirstName: string;
  LastName: string;
  Email: string;
}>;

/* ---------------------- Hook: tema reactivo (sin F5) ---------------------- */
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

/* ---------------------------- Utilidad fetch JSON ---------------------------- */
async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    ...init,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = (await res.json()) as { error?: string };
      if (j?.error) msg = j.error;
    } catch {}
    throw new Error(msg || "Request error");
  }
  return (await res.json()) as T;
}

/* ------------------------------ Diff de update ------------------------------ */
function toUpdatePayload(info: UserInfo): UpdatePayload {
  return {
    Login: info.login,
    FirstName: info.firstName,
    LastName: info.lastName,
    Email: info.email,
  };
}
function diffUpdatePayload(
  original: UserInfo,
  current: UserInfo
): UpdatePayload {
  const all = toUpdatePayload(current);
  const base = toUpdatePayload(original);
  const out: UpdatePayload = {};
  (Object.keys(all) as (keyof UpdatePayload)[]).forEach((k) => {
    if (all[k] !== base[k]) out[k] = all[k];
  });
  return out;
}

/* ================================== Page ================================== */
export default function UsersPage() {
  const theme = useReactiveTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  /* --------- helpers de estilo para IconMark -------- */
  type MarkVars = React.CSSProperties & {
    ["--iconmark-bg"]?: string;
    ["--iconmark-border"]?: string;
    ["--iconmark-icon-fg"]?: string;
    ["--iconmark-hover-bg"]?: string;
    ["--iconmark-hover-border"]?: string;
    ["--iconmark-hover-icon-fg"]?: string;
  };

  const NORMAL_BORDER = theme === "light" ? "#0e1117" : "#ffffff";
  const NORMAL_BG = theme === "light" ? "#e2e5ea" : "#0b0b0d";
  const FG_NORMAL = theme === "light" ? "#010409" : "#ffffff";
  const FG_ACTIVE = theme === "light" ? "#0b0b0d" : "#ffffff";

  const markWithAccent = (accent: string): MarkVars => ({
    ["--iconmark-bg"]: NORMAL_BG,
    ["--iconmark-border"]: NORMAL_BORDER,
    ["--iconmark-icon-fg"]: FG_NORMAL,
    ["--iconmark-hover-bg"]: accent,
    ["--iconmark-hover-border"]: accent,
    ["--iconmark-hover-icon-fg"]: FG_ACTIVE,
  });

  /* Estado UI */
  const [search, setSearch] = useState("");

  /* Lista */
  const [list, setList] = useState<UserListItem[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  /* Detalle */
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [info, setInfo] = useState<UserInfo | null>(null);
  const [originalInfo, setOriginalInfo] = useState<UserInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  /* Modales */
  const [createOpen, setCreateOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteBusy, setDeleteBusy] = useState(false);

  /* ------------------------------- Cargar lista ------------------------------ */
  async function loadList(): Promise<UserListItem[]> {
    setLoadingList(true);
    setListError(null);
    try {
      const data = await fetchJSON<UserListItem[]>("/api/users/list");
      setList(data);
      return data;
    } catch (e) {
      setListError((e as Error).message);
      return [];
    } finally {
      setLoadingList(false);
    }
  }
  useEffect(() => {
    if (!mounted) return;
    void loadList();
  }, [mounted]);

  /* ------------------------------ Cargar detalle ----------------------------- */
  async function loadInfo(id: number) {
    setLoadingInfo(true);
    setDetailError(null);
    try {
      const data = await fetchJSON<UserInfo>(`/api/users/getUser/${id}`);
      setInfo(data);
      setOriginalInfo(data);
    } catch (e) {
      setDetailError((e as Error).message);
      setInfo(null);
      setOriginalInfo(null);
    } finally {
      setLoadingInfo(false);
    }
  }

  /* --------------------------------- Crear --------------------------------- */
  async function createUser(login: string, pass: string) {
    const payload: CreatePayload = { Login: login.trim(), Password: pass };
    try {
      await fetchJSON<unknown>("/api/users/create?", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setCreateOpen(false);
      const fresh = await loadList();
      const created = fresh.find((u) => u.login === payload.Login);
      if (created) {
        setSelectedId(created.id);
        void loadInfo(created.id);
      }
    } catch (e) {
      alert(`No se pudo crear el usuario: ${(e as Error).message}`);
    }
  }

  /* ------------------------------- Guardar ---------------------------------- */
  const hasChanges = useMemo(() => {
    if (!info || !originalInfo) return false;
    return Object.keys(diffUpdatePayload(originalInfo, info)).length > 0;
  }, [info, originalInfo]);

  function requestSave() {
    if (!info || !originalInfo || selectedId == null) return;
    const diff = diffUpdatePayload(originalInfo, info);
    if (Object.keys(diff).length === 0) return;
    setConfirmOpen(true);
  }

  async function performSave() {
    if (!info || !originalInfo || selectedId == null) return;
    const diff = diffUpdatePayload(originalInfo, info);
    if (Object.keys(diff).length === 0) {
      setConfirmOpen(false);
      return;
    }
    try {
      setConfirmBusy(true);
      await fetchJSON<unknown>(`/api/users/update/${selectedId}`, {
        method: "PUT",
        body: JSON.stringify(diff),
      });
      setOriginalInfo(info);
      await loadList();
      setConfirmOpen(false);
    } catch (e) {
      alert(`No se pudo actualizar: ${(e as Error).message}`);
    } finally {
      setConfirmBusy(false);
    }
  }

  /* ------------------------------- Eliminar --------------------------------- */
  function requestDelete() {
    if (selectedId == null || !info) return;
    setDeleteOpen(true);
  }

  async function performDelete() {
    if (selectedId == null || !info) {
      setDeleteOpen(false);
      return;
    }
    try {
      setDeleteBusy(true);
      await fetchJSON<unknown>(`/api/users/delete/${selectedId}`, {
        method: "DELETE",
      });
      setSelectedId(null);
      setInfo(null);
      setOriginalInfo(null);
      await loadList();
      setDeleteOpen(false);
    } catch (e) {
      alert(`No se pudo eliminar: ${(e as Error).message}`);
    } finally {
      setDeleteBusy(false);
    }
  }

  /* ------------------------------- Derivados UI ------------------------------ */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((u) => u.login.toLowerCase().includes(q));
  }, [search, list]);

  /* ----------------------------- Estilos globales ---------------------------- */
  const subtleText = theme === "light" ? "text-zinc-500" : "text-zinc-400";
  const cardCls = [
    "rounded-2xl border shadow-sm",
    theme === "light"
      ? "bg-white border-zinc-300"
      : "bg-[#0D1117] border-zinc-700",
  ].join(" ");

  if (!mounted) return <div className="p-6" />;

  /* Tono para las cabeceras (más oscuro en claro / más claro en oscuro) */
  const headerTone =
    theme === "light"
      ? "bg-[#E7EBF1]/90 border-zinc-300"
      : "bg-[#131821]/90 border-zinc-700";

  return (
    <div
      className="p-4 md:p-6 users-scope"
      style={{ "--accent": USERS_ACCENT } as AccentVars}
    >
      <style jsx global>{`
        /* Fuente Sora para toda la página */
        .users-scope {
          font-family: var(--font-heading, Sora, ui-sans-serif);
        }
        .users-scope input,
        .users-scope button,
        .users-scope textarea,
        .users-scope select {
          font: inherit;
        }

        .iconmark-btn {
          cursor: pointer;
        }
        .iconmark-btn:hover .mj-iconmark {
          --mark-bg: var(--iconmark-hover-bg, var(--iconmark-bg));
          --mark-border: var(--iconmark-hover-border, var(--iconmark-border));
          --mark-fg: var(--iconmark-hover-icon-fg, var(--iconmark-icon-fg));
        }
        .iconmark-btn:hover .mj-iconmark[data-anim="zoom"] .icon-default {
          transform: scale(1.5) !important;
        }
        .iconmark-btn:hover .mj-iconmark[data-anim="zoom"] .icon-hover {
          transform: scale(1) !important;
        }

        .modal-actions .mj-iconmark {
          width: 40px;
          height: 40px;
        }
      `}</style>

      {/* Header tipo dashboard */}
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

      {/* ⬇️ Layout en columna: arriba panel 1 con ancho limitado, abajo detalles full width */}
      <div className="flex flex-col gap-6">
        {/* ------------------------------ Card arriba: buscador/lista (1/3 del viewport) ------------------------------ */}
        <aside
          className={[
            cardCls,
            "w-full sm:w-[33vw] md:w-[33.333vw] self-start",
          ].join(" ")}
        >
          {/* Header sticky con buscador + nuevo */}
          <div
            className={[
              "sticky top-0 z-10 px-4 pt-4 pb-3 border-b rounded-t-2xl",
              "backdrop-blur supports-[backdrop-filter]:backdrop-blur",
              headerTone,
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-3">
              {/* Buscador vuelve a ocupar el espacio disponible */}
              <div className="relative flex-1">
                <input
                  value={search}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Buscar usuario…"
                  className={[
                    "w-full h-11 rounded-xl pl-10 pr-3 border outline-none",
                    theme === "light"
                      ? "bg-[#F6F8FA] border-zinc-300 text-zinc-900 placeholder-zinc-500"
                      : "bg-[#0D1117] border-zinc-700 text-white placeholder-zinc-400",
                    "focus:ring-2 focus:ring-[var(--brand,#8E2434)]/40",
                  ].join(" ")}
                />
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  size={18}
                />
              </div>

              {/* Nuevo usuario (abre modal) */}
              <button
                type="button"
                title="Nuevo usuario"
                aria-label="Nuevo usuario"
                className="group iconmark-btn"
                onClick={() => setCreateOpen(true)}
              >
                <IconMark
                  size="md"
                  borderWidth={2}
                  interactive
                  hoverAnim="zoom"
                  zoomScale={ZOOM}
                  style={markWithAccent(ACC_CREATE)}
                >
                  <UserPlus className="block" />
                </IconMark>
              </button>
            </div>
          </div>

          {/* Lista */}
          <div className="max-h-[70vh] overflow-auto p-2">
            {loadingList && (
              <p className={`px-3 py-2 text-sm ${subtleText}`}>Cargando…</p>
            )}
            {listError && (
              <p className="px-3 py-2 text-sm text-red-400">{listError}</p>
            )}
            {!loadingList && filtered.length === 0 && (
              <p className={`px-3 py-2 text-sm ${subtleText}`}>
                Sin resultados.
              </p>
            )}

            <ul className="space-y-1">
              {filtered.map((u) => {
                const active = u.id === selectedId;

                const inactiveHover =
                  theme === "light" ? "hover:bg-black/5" : "hover:bg-white/5";

                const activeCls =
                  theme === "light"
                    ? "bg-[#1F2937] text-white"
                    : "bg-white text-[#0D1117]";

                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(u.id);
                        void loadInfo(u.id);
                      }}
                      className={[
                        "w-full text-left px-3 py-2 rounded-xl transition cursor-pointer",
                        active ? activeCls : inactiveHover,
                      ].join(" ")}
                    >
                      {u.login}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </aside>

        {/* ------------------------------ Card abajo: detalle (full width) ------------------------------ */}
        <section className={[cardCls, "relative"].join(" ")}>
          {/* Header con acciones */}
          <div
            className={[
              "sticky top-0 z-10 px-5 py-4 border-b flex items-center justify-between gap-3 rounded-t-2xl",
              "backdrop-blur supports-[backdrop-filter]:backdrop-blur",
              headerTone,
            ].join(" ")}
          >
            <div>
              <h2 className="text-base font-semibold">
                {selectedId && info ? info.login : "Detalles del usuario"}
              </h2>
              <p className={`text-xs mt-0.5 ${subtleText}`}>
                {selectedId
                  ? loadingInfo
                    ? "Cargando…"
                    : "Editar información"
                  : "Selecciona un usuario"}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                title={hasChanges ? "Guardar" : "Nada que guardar"}
                aria-label={hasChanges ? "Guardar" : "Nada que guardar"}
                onClick={requestSave}
                disabled={!hasChanges || !selectedId}
                className={[
                  "group iconmark-btn",
                  (!hasChanges || !selectedId) &&
                    "opacity-50 pointer-events-none",
                ].join(" ")}
              >
                <IconMark
                  size="md"
                  borderWidth={2}
                  interactive
                  hoverAnim="zoom"
                  zoomScale={ZOOM}
                  style={markWithAccent(ACC_SAVE)}
                >
                  <Save className="block" />
                </IconMark>
              </button>

              <button
                type="button"
                title="Eliminar usuario"
                aria-label="Eliminar usuario"
                onClick={requestDelete}
                disabled={!selectedId}
                className={[
                  "group iconmark-btn",
                  !selectedId && "opacity-50 pointer-events-none",
                ].join(" ")}
              >
                <IconMark
                  size="md"
                  borderWidth={2}
                  interactive
                  hoverAnim="zoom"
                  zoomScale={ZOOM}
                  style={markWithAccent(ACC_DELETE)}
                >
                  <Trash2 className="block" />
                </IconMark>
              </button>
            </div>
          </div>

          {/* Contenido */}
          <div className="p-5">
            {!selectedId && (
              <p className={subtleText}>Selecciona un usuario de la lista.</p>
            )}
            {selectedId && loadingInfo && <p>Cargando detalles…</p>}
            {detailError && (
              <p className="text-sm text-red-400">{detailError}</p>
            )}

            {selectedId && info && (
              <form
                className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl"
                onSubmit={(e) => {
                  e.preventDefault();
                  requestSave();
                }}
              >
                <Field
                  label="Login"
                  value={info.login}
                  onChange={(v: string) => setInfo({ ...info, login: v })}
                  theme={theme}
                />
                <Field
                  label="Email"
                  value={info.email}
                  onChange={(v: string) => setInfo({ ...info, email: v })}
                  theme={theme}
                />
                <Field
                  label="Nombre"
                  value={info.firstName}
                  onChange={(v: string) => setInfo({ ...info, firstName: v })}
                  theme={theme}
                />
                <Field
                  label="Apellidos"
                  value={info.lastName}
                  onChange={(v: string) => setInfo({ ...info, lastName: v })}
                  theme={theme}
                />
                <input type="submit" hidden />
              </form>
            )}
          </div>
        </section>
      </div>

      {/* Modales */}
      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={createUser}
        theme={theme}
      />

      <ConfirmModal
        open={confirmOpen}
        onClose={() => (confirmBusy ? null : setConfirmOpen(false))}
        onConfirm={performSave}
        busy={confirmBusy}
        theme={theme}
        title="Confirmar guardado"
        message="¿Guardar los cambios del usuario?"
      />

      <DeleteModal
        open={deleteOpen}
        onClose={() => (deleteBusy ? null : setDeleteOpen(false))}
        onConfirm={performDelete}
        busy={deleteBusy}
        theme={theme}
        userLogin={info?.login ?? ""}
      />
    </div>
  );
}

/* --------------------------------- Field --------------------------------- */
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
          theme === "light"
            ? "bg-[#F6F8FA] border-zinc-300 text-zinc-900"
            : "bg-[#0D1117] border-zinc-700 text-white",
          "focus:ring-2 focus:ring-[var(--brand,#8E2434)]/40",
        ].join(" ")}
      />
    </label>
  );
}

/* --------------------------- Modal: Crear usuario -------------------------- */
function CreateUserModal({
  open,
  onClose,
  onSubmit,
  theme,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (login: string, pass: string) => Promise<void>;
  theme: Theme;
}) {
  const [login, setLogin] = useState("");
  const [pass, setPass] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) {
      setLogin("");
      setPass("");
      setBusy(false);
    }
  }, [open]);

  if (!open) return null;

  const isLight = theme === "light";

  type MarkVars = React.CSSProperties & {
    ["--iconmark-bg"]?: string;
    ["--iconmark-border"]?: string;
    ["--iconmark-icon-fg"]?: string;
    ["--iconmark-hover-bg"]?: string;
    ["--iconmark-hover-border"]?: string;
    ["--iconmark-hover-icon-fg"]?: string;
  };
  const NORMAL_BORDER = isLight ? "#0e1117" : "#ffffff";
  const NORMAL_BG = isLight ? "#e2e5ea" : "#0b0b0d";
  const FG_NORMAL = isLight ? "#010409" : "#ffffff";
  const FG_ACTIVE = isLight ? "#0b0b0d" : "#ffffff";
  const markWithAccent = (accent: string): MarkVars => ({
    ["--iconmark-bg"]: NORMAL_BG,
    ["--iconmark-border"]: NORMAL_BORDER,
    ["--iconmark-icon-fg"]: FG_NORMAL,
    ["--iconmark-hover-bg"]: accent,
    ["--iconmark-hover-border"]: accent,
    ["--iconmark-hover-icon-fg"]: FG_ACTIVE,
  });

  function stop(e: React.MouseEvent) {
    e.stopPropagation();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!login.trim() || !pass || busy) return;
    setBusy(true);
    try {
      await onSubmit(login, pass);
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
        onMouseDown={stop}
      >
        <div
          className="flex items-center justify-between px-5 pt-4 pb-3 rounded-t-2xl"
          style={{ background: ACC_CREATE, color: "#fff" }}
        >
          <h2 className="text-lg font-semibold">Crear usuario</h2>
          <button
            type="button"
            aria-label="Cerrar"
            className="iconmark-btn"
            onClick={onClose}
            title="Cerrar"
          >
            <IconMark
              size="md"
              borderWidth={2}
              interactive
              hoverAnim="zoom"
              zoomScale={1.5}
              style={markWithAccent(ACC_DELETE)}
            >
              <X className="block" />
            </IconMark>
          </button>
        </div>

        <form
          className="px-5 pb-5 pt-4 space-y-4"
          onSubmit={handleSubmit}
          autoComplete="off"
        >
          <label className="block">
            <span className="block text-sm mb-1 opacity-80">Usuario</span>
            <input
              value={login}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setLogin(e.target.value)
              }
              placeholder="Login"
              autoComplete="off"
              className={[
                "w-full h-11 rounded-xl px-3 border outline-none",
                isLight
                  ? "bg-[#F6F8FA] border-zinc-300 text-zinc-900"
                  : "bg-[#0D1117] border-zinc-700 text-white",
                "focus:ring-2 focus:ring-[var(--brand,#8E2434)]/40",
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
              autoComplete="new-password"
              className={[
                "w-full h-11 rounded-xl px-3 border outline-none",
                isLight
                  ? "bg-[#F6F8FA] border-zinc-300 text-zinc-900"
                  : "bg-[#0D1117] border-zinc-700 text-white",
                "focus:ring-2 focus:ring-[var(--brand,#8E2434)]/40",
              ].join(" ")}
            />
          </label>

          <div className="modal-actions pt-2 grid grid-cols-2 gap-3">
            <button
              type="submit"
              disabled={busy || !login.trim() || !pass}
              className={[
                "iconmark-btn inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border transition",
                isLight
                  ? "bg-white text-zinc-900 border-zinc-300 hover:bg-zinc-100"
                  : "bg-[#0D1117] text-white border-zinc-700 hover:bg-zinc-800",
                (busy || !login.trim() || !pass) &&
                  "opacity-60 pointer-events-none",
              ].join(" ")}
            >
              <IconMark
                size="md"
                borderWidth={2}
                interactive
                hoverAnim="zoom"
                zoomScale={1.5}
                style={markWithAccent(ACC_CREATE)}
              >
                <UserPlus className="block" />
              </IconMark>
              Crear
            </button>

            <button
              type="button"
              onClick={onClose}
              className={[
                "iconmark-btn inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border transition",
                isLight
                  ? "bg-white text-zinc-900 border-zinc-300 hover:bg-zinc-100"
                  : "bg-[#0D1117] text-white border-zinc-700 hover:bg-zinc-800",
              ].join(" ")}
            >
              <IconMark
                size="md"
                borderWidth={2}
                interactive
                hoverAnim="zoom"
                zoomScale={1.5}
                style={markWithAccent(ACC_DELETE)}
              >
                <X className="block" />
              </IconMark>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* --------------------------- Modal: Confirmación --------------------------- */
function ConfirmModal({
  open,
  onClose,
  onConfirm,
  busy = false,
  theme,
  title,
  message,
}: {
  open: boolean;
  onClose: () => void | null;
  onConfirm: () => void | Promise<void>;
  busy?: boolean;
  theme: Theme;
  title: string;
  message: string;
}) {
  if (!open) return null;
  const isLight = theme === "light";

  type MarkVars = React.CSSProperties & {
    ["--iconmark-bg"]?: string;
    ["--iconmark-border"]?: string;
    ["--iconmark-icon-fg"]?: string;
    ["--iconmark-hover-bg"]?: string;
    ["--iconmark-hover-border"]?: string;
    ["--iconmark-hover-icon-fg"]?: string;
  };
  const NORMAL_BORDER = isLight ? "#0e1117" : "#ffffff";
  const NORMAL_BG = isLight ? "#e2e5ea" : "#0b0b0d";
  const FG_NORMAL = isLight ? "#010409" : "#ffffff";
  const FG_ACTIVE = isLight ? "#0b0b0d" : "#ffffff";
  const markWithAccent = (accent: string): MarkVars => ({
    ["--iconmark-bg"]: NORMAL_BG,
    ["--iconmark-border"]: NORMAL_BORDER,
    ["--iconmark-icon-fg"]: FG_NORMAL,
    ["--iconmark-hover-bg"]: accent,
    ["--iconmark-hover-border"]: accent,
    ["--iconmark-hover-icon-fg"]: FG_ACTIVE,
  });

  function stop(e: React.MouseEvent) {
    e.stopPropagation();
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] grid place-items-center p-4"
      onMouseDown={() => onClose && onClose()}
    >
      <div
        className={[
          "relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden",
          isLight ? "bg-white border-zinc-300" : "bg-[#0D1117] border-zinc-700",
        ].join(" ")}
        onMouseDown={stop}
      >
        <div
          className="flex items-center justify-between px-5 pt-4 pb-3 rounded-t-2xl"
          style={{ background: ACC_SAVE, color: "#fff" }}
        >
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            type="button"
            aria-label="Cerrar"
            className="iconmark-btn"
            onClick={() => onClose && onClose()}
            title="Cerrar"
          >
            <IconMark
              size="md"
              borderWidth={2}
              interactive
              hoverAnim="zoom"
              zoomScale={1.5}
              style={markWithAccent(ACC_DELETE)}
            >
              <X className="block" />
            </IconMark>
          </button>
        </div>

        <div className="px-5 pt-4 pb-5 space-y-6">
          <p className="text-sm opacity-90">{message}</p>

          <div className="modal-actions grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className={[
                "iconmark-btn inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border transition",
                isLight
                  ? "bg-white text-zinc-900 border-zinc-300 hover:bg-zinc-100"
                  : "bg-[#0D1117] text-white border-zinc-700 hover:bg-zinc-800",
                busy && "opacity-60 pointer-events-none",
              ].join(" ")}
            >
              <IconMark
                size="md"
                borderWidth={2}
                interactive
                hoverAnim="zoom"
                zoomScale={1.5}
                style={markWithAccent(ACC_SAVE)}
              >
                <Save className="block" />
              </IconMark>
              Guardar
            </button>

            <button
              type="button"
              onClick={() => onClose && onClose()}
              className={[
                "iconmark-btn inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border transition",
                isLight
                  ? "bg-white text-zinc-900 border-zinc-300 hover:bg-zinc-100"
                  : "bg-[#0D1117] text-white border-zinc-700 hover:bg-zinc-800",
              ].join(" ")}
            >
              <IconMark
                size="md"
                borderWidth={2}
                interactive
                hoverAnim="zoom"
                zoomScale={1.5}
                style={markWithAccent(ACC_DELETE)}
              >
                <X className="block" />
              </IconMark>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* --------------------------- Modal: Eliminar --------------------------- */
function DeleteModal({
  open,
  onClose,
  onConfirm,
  busy = false,
  theme,
  userLogin,
}: {
  open: boolean;
  onClose: () => void | null;
  onConfirm: () => void | Promise<void>;
  busy?: boolean;
  theme: Theme;
  userLogin: string;
}) {
  if (!open) return null;
  const isLight = theme === "light";

  type MarkVars = React.CSSProperties & {
    ["--iconmark-bg"]?: string;
    ["--iconmark-border"]?: string;
    ["--iconmark-icon-fg"]?: string;
    ["--iconmark-hover-bg"]?: string;
    ["--iconmark-hover-border"]?: string;
    ["--iconmark-hover-icon-fg"]?: string;
  };
  const NORMAL_BORDER = isLight ? "#0e1117" : "#ffffff";
  const NORMAL_BG = isLight ? "#e2e5ea" : "#0b0b0d";
  const FG_NORMAL = isLight ? "#010409" : "#ffffff";
  const FG_ACTIVE = isLight ? "#0b0b0d" : "#ffffff";
  const markWithAccent = (accent: string): MarkVars => ({
    ["--iconmark-bg"]: NORMAL_BG,
    ["--iconmark-border"]: NORMAL_BORDER,
    ["--iconmark-icon-fg"]: FG_NORMAL,
    ["--iconmark-hover-bg"]: accent,
    ["--iconmark-hover-border"]: accent,
    ["--iconmark-hover-icon-fg"]: FG_ACTIVE,
  });

  function stop(e: React.MouseEvent) {
    e.stopPropagation();
  }

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-[2px] grid place-items-center p-4"
      onMouseDown={() => onClose && onClose()}
    >
      <div
        className={[
          "relative w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden",
          isLight ? "bg-white border-zinc-300" : "bg-[#0D1117] border-zinc-700",
        ].join(" ")}
        onMouseDown={stop}
      >
        <div
          className="flex items-center justify-between px-5 pt-4 pb-3 rounded-t-2xl"
          style={{ background: ACC_DELETE, color: "#fff" }}
        >
          <h2 className="text-lg font-semibold">Confirmar eliminación</h2>
          <button
            type="button"
            aria-label="Cerrar"
            className="iconmark-btn"
            onClick={() => onClose && onClose()}
            title="Cerrar"
          >
            <IconMark
              size="md"
              borderWidth={2}
              interactive
              hoverAnim="zoom"
              zoomScale={1.5}
              style={markWithAccent(ACC_DELETE)}
            >
              <X className="block" />
            </IconMark>
          </button>
        </div>

        <div className="px-5 pt-4 pb-5 space-y-6">
          <p className="text-sm opacity-90">
            ¿Eliminar al usuario “{userLogin}”? Esta acción no se puede
            deshacer.
          </p>

          <div className="modal-actions grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={onConfirm}
              disabled={busy}
              className={[
                "iconmark-btn inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border transition",
                isLight
                  ? "bg-white text-zinc-900 border-zinc-300 hover:bg-zinc-100"
                  : "bg-[#0D1117] text-white border-zinc-700 hover:bg-zinc-800",
                busy && "opacity-60 pointer-events-none",
              ].join(" ")}
            >
              <IconMark
                size="md"
                borderWidth={2}
                interactive
                hoverAnim="zoom"
                zoomScale={1.5}
                style={markWithAccent(ACC_DELETE)}
              >
                <Trash2 className="block" />
              </IconMark>
              Eliminar
            </button>

            <button
              type="button"
              onClick={() => onClose && onClose()}
              className={[
                "iconmark-btn inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border transition",
                isLight
                  ? "bg-white text-zinc-900 border-zinc-300 hover:bg-zinc-100"
                  : "bg-[#0D1117] text-white border-zinc-700 hover:bg-zinc-800",
              ].join(" ")}
            >
              <IconMark
                size="md"
                borderWidth={2}
                interactive
                hoverAnim="zoom"
                zoomScale={1.5}
                style={markWithAccent(ACC_DELETE)}
              >
                <X className="block" />
              </IconMark>
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
