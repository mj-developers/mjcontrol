"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Save,
  Trash2,
  Search,
  UserPlus,
  X,
  type LucideIcon,
} from "lucide-react";
import IconCircle from "@/components/ui/IconMark";
import { getInitialTheme, type Theme } from "@/lib/theme";

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
    } catch {
      /* ignora parse error */
    }
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
  /* Tema (coherente con el layout) */
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setTheme(getInitialTheme());
    setMounted(true);
  }, []);

  /* Estilo base de IconCircle */
  const NORMAL_BORDER = theme === "light" ? "#0e1117" : "#ffffff";
  const NORMAL_BG = theme === "light" ? "#e2e5ea" : "#0b0b0d";
  const circleBaseProps = {
    theme,
    size: "md" as const,
    borderWidth: 2,
    borderColor: { light: NORMAL_BORDER, dark: NORMAL_BORDER },
    bg: { light: NORMAL_BG, dark: NORMAL_BG },
    fillOnHover: true,
    hoverEffect: "none" as const,
    zoomOnHover: false,
  };

  /* Acentos */
  const ACC_CREATE = "#10B981";
  const ACC_SAVE = "#6366F1";
  const ACC_DELETE = "#8E2434";

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

  /* Modal crear */
  const [createOpen, setCreateOpen] = useState(false);

  /* ------------------------------- Cargar lista ------------------------------ */
  async function loadList(): Promise<UserListItem[]> {
    setLoadingList(true);
    setListError(null);
    try {
      const data = await fetchJSON<UserListItem[]>("/api/users/list");
      setList(data);
      return data;
    } catch (e) {
      const msg = (e as Error).message;
      setListError(msg);
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

  /* ------------------------------- Guardar / Del ------------------------------ */
  const hasChanges = useMemo(() => {
    if (!info || !originalInfo) return false;
    return Object.keys(diffUpdatePayload(originalInfo, info)).length > 0;
  }, [info, originalInfo]);

  async function handleSave() {
    if (!info || !originalInfo || selectedId == null) return;
    const diff = diffUpdatePayload(originalInfo, info);
    if (Object.keys(diff).length === 0) return;
    if (!window.confirm("¿Guardar los cambios del usuario?")) return;
    try {
      await fetchJSON<unknown>(`/api/users/update/${selectedId}`, {
        method: "PUT",
        body: JSON.stringify(diff),
      });
      setOriginalInfo(info);
      await loadList();
    } catch (e) {
      alert(`No se pudo actualizar: ${(e as Error).message}`);
    }
  }

  async function handleDelete() {
    if (selectedId == null || !info) return;
    if (
      !window.confirm(
        `¿Eliminar al usuario “${info.login}”? Esta acción no se puede deshacer.`
      )
    )
      return;
    try {
      await fetchJSON<unknown>(`/api/users/delete/${selectedId}`, {
        method: "DELETE",
      });
      setSelectedId(null);
      setInfo(null);
      setOriginalInfo(null);
      await loadList();
    } catch (e) {
      alert(`No se pudo eliminar: ${(e as Error).message}`);
    }
  }

  /* ------------------------------- Derivados UI ------------------------------ */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((u) => u.login.toLowerCase().includes(q));
  }, [search, list]);

  function IconOnly({
    title,
    accent,
    Icon,
    onClick,
    disabled,
  }: {
    title: string;
    accent: string;
    Icon: LucideIcon;
    onClick?: () => void;
    disabled?: boolean;
  }) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        aria-label={title}
        disabled={disabled}
        className={[
          "group",
          disabled ? "opacity-50 pointer-events-none" : "",
        ].join(" ")}
      >
        <IconCircle {...circleBaseProps} accent={accent}>
          <Icon className="block transition-transform group-hover:scale-[1.15]" />
        </IconCircle>
      </button>
    );
  }

  if (!mounted) return <div className="p-6" />;

  /* tokens de card por tema */
  const cardCls = [
    "rounded-2xl border shadow-sm",
    theme === "light"
      ? "bg-white border-zinc-300"
      : "bg-[#0D1117] border-zinc-700",
  ].join(" ");

  const subtleText = theme === "light" ? "text-zinc-500" : "text-zinc-400";

  return (
    <div className="p-4 md:p-6">
      <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-6">
        {/* ------------------------------ Card izquierda ------------------------------ */}
        <aside className={cardCls}>
          {/* Header sticky con buscador + nuevo */}
          <div
            className={[
              "sticky top-0 z-10 px-4 pt-4 pb-3 border-b",
              theme === "light"
                ? "bg-white/90 border-zinc-200"
                : "bg-[#0D1117]/90 border-zinc-800",
              "backdrop-blur supports-[backdrop-filter]:backdrop-blur",
              "rounded-t-2xl",
            ].join(" ")}
          >
            <div className="flex items-center justify-between gap-3">
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
              <IconOnly
                title="Nuevo usuario"
                accent={ACC_CREATE}
                Icon={UserPlus}
                onClick={() => setCreateOpen(true)}
              />
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
                return (
                  <li key={u.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedId(u.id);
                        void loadInfo(u.id);
                      }}
                      className={[
                        "w-full text-left px-3 py-2 rounded-xl transition",
                        active
                          ? "bg-[var(--brand,#8E2434)]/15"
                          : "hover:bg-zinc-500/10",
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

        {/* ------------------------------ Card derecha ------------------------------ */}
        <section className={[cardCls, "relative"].join(" ")}>
          {/* Header con acciones */}
          <div
            className={[
              "sticky top-0 z-10 px-5 py-4 border-b flex items-center justify-between gap-3 rounded-t-2xl",
              theme === "light"
                ? "bg-white/90 border-zinc-200"
                : "bg-[#0D1117]/90 border-zinc-800",
              "backdrop-blur supports-[backdrop-filter]:backdrop-blur",
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
              <IconOnly
                title={hasChanges ? "Guardar" : "Nada que guardar"}
                accent={ACC_SAVE}
                Icon={Save}
                onClick={handleSave}
                disabled={!hasChanges || !selectedId}
              />
              <IconOnly
                title="Eliminar usuario"
                accent={ACC_DELETE}
                Icon={Trash2}
                onClick={handleDelete}
                disabled={!selectedId}
              />
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
                  void handleSave();
                }}
              >
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

                {/* No mostramos botón "Guardar cambios" aquí: se guarda con el disquete del header */}
                <input type="submit" hidden />
              </form>
            )}
          </div>
        </section>
      </div>

      {/* Modal Crear usuario */}
      <CreateUserModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={createUser}
        theme={theme}
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

  // Estilo IconCircle (calculado localmente)
  const NORMAL_BORDER = isLight ? "#0e1117" : "#ffffff";
  const NORMAL_BG = isLight ? "#e2e5ea" : "#0b0b0d";
  const circleBaseProps = {
    theme,
    size: "md" as const,
    borderWidth: 2,
    borderColor: { light: NORMAL_BORDER, dark: NORMAL_BORDER },
    bg: { light: NORMAL_BG, dark: NORMAL_BG },
    fillOnHover: true,
    hoverEffect: "none" as const,
    zoomOnHover: false,
  };

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
          "relative w-full max-w-md rounded-2xl border shadow-2xl",
          isLight ? "bg-white border-zinc-300" : "bg-[#0D1117] border-zinc-700",
        ].join(" ")}
        onMouseDown={stop}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 pt-4 pb-3 border-b
                        border-zinc-200 dark:border-zinc-800 rounded-t-2xl"
        >
          <h2 className="text-lg font-semibold">Crear usuario</h2>
          <button
            type="button"
            aria-label="Cerrar"
            className="p-2 rounded-lg hover:bg-zinc-500/10"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        <form
          className="px-5 pb-5 pt-4 space-y-4"
          onSubmit={handleSubmit}
          autoComplete="off" // no recordar
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
              autoComplete="new-password" // no recordar
              className={[
                "w-full h-11 rounded-xl px-3 border outline-none",
                isLight
                  ? "bg-[#F6F8FA] border-zinc-300 text-zinc-900"
                  : "bg-[#0D1117] border-zinc-700 text-white",
                "focus:ring-2 focus:ring-[var(--brand,#8E2434)]/40",
              ].join(" ")}
            />
          </label>

          {/* Footer */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="submit"
              disabled={busy || !login.trim() || !pass}
              className={[
                "inline-flex items-center gap-2 py-2.5 px-4 rounded-xl border transition",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand,#8E2434)]/40",
                isLight
                  ? "bg-white text-zinc-900 border-zinc-300 hover:bg-zinc-100"
                  : "bg-[#0D1117] text-white border-zinc-700 hover:bg-zinc-800",
                (busy || !login.trim() || !pass) &&
                  "opacity-60 pointer-events-none",
              ].join(" ")}
            >
              <IconCircle {...circleBaseProps} accent="#10B981">
                <UserPlus className="block" />
              </IconCircle>
              Crear
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-xl underline opacity-90 hover:opacity-100"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
