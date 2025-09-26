"use client";

import * as React from "react";
import IconMark from "@/components/ui/IconMark";
import {
  Star,
  Heart,
  Flame,
  Home,
  Check,
  X,
  Play,
  Pause,
  Sun,
  Moon,
  Copy,
} from "lucide-react";

/* =========================
   Icon registry (lucide)
   ========================= */

type IconKey =
  | "Star"
  | "Heart"
  | "Flame"
  | "Home"
  | "Check"
  | "X"
  | "Play"
  | "Pause"
  | "Sun"
  | "Moon";

const ICONS: Record<IconKey, React.ReactElement> = {
  Star: <Star />,
  Heart: <Heart />,
  Flame: <Flame />,
  Home: <Home />,
  Check: <Check />,
  X: <X />,
  Play: <Play />,
  Pause: <Pause />,
  Sun: <Sun />,
  Moon: <Moon />,
};

/* =========================
   Types que reflejan IconMark
   ========================= */

type Shape = "circle" | "rounded" | "square" | "pill";
type SizeKey =
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "xxl"
  | "heroSm"
  | "hero"
  | "xxxl";
type HoverAnim = "none" | "zoom" | "cycle";
type SizeChoice = "preset" | "number";

type StyleVars = {
  ["--mark-bg"]?: string;
  ["--mark-border"]?: string;
  ["--mark-fg"]?: string;
};

type BuilderState = {
  sizeChoice: SizeChoice;
  sizeKey: SizeKey;
  sizeNumber: number;
  iconSize: number;
  shape: Shape;
  borderWidth: number;

  interactive: boolean;
  asButton: boolean;
  disabled: boolean;
  buttonType: "button" | "submit" | "reset";
  title: string;
  ariaLabel: string;

  hoverAnim: HoverAnim;
  zoomScale: number;
  cycleOffset: number;
  cycleAngleDeg: number;
  cycleRotateDeg: number;

  icon: IconKey;
  hoverIcon?: IconKey;

  styles: StyleVars;
};

const DEFAULTS: BuilderState = {
  sizeChoice: "preset",
  sizeKey: "md",
  sizeNumber: 44,
  iconSize: 0, // 0 -> auto
  shape: "circle",
  borderWidth: 2,

  interactive: true,
  asButton: false,
  disabled: false,
  buttonType: "button",
  title: "",
  ariaLabel: "",

  hoverAnim: "zoom",
  zoomScale: 1.06,
  cycleOffset: 10,
  cycleAngleDeg: 35,
  cycleRotateDeg: 14,

  icon: "Star",
  hoverIcon: "Heart",

  styles: {
    "--mark-bg": "#ffffff",
    "--mark-border": "#e5e7eb",
    "--mark-fg": "#0f172a",
  },
};

/* =========================
   Presets (9)
   ========================= */

const PRESETS: Array<{ title: string; patch: Partial<BuilderState> }> = [
  {
    title: "Circle / Star",
    patch: {
      shape: "circle",
      hoverAnim: "zoom",
      styles: {
        "--mark-bg": "#ffffff",
        "--mark-border": "#e5e7eb",
        "--mark-fg": "#0f172a",
      },
      icon: "Star",
      hoverIcon: "Heart",
    },
  },
  {
    title: "Rounded / Home",
    patch: {
      shape: "rounded",
      icon: "Home",
      hoverIcon: "Sun",
      styles: {
        "--mark-bg": "#f8fafc",
        "--mark-border": "#e2e8f0",
        "--mark-fg": "#0f172a",
      },
    },
  },
  {
    title: "Square / Flame",
    patch: {
      shape: "square",
      icon: "Flame",
      hoverIcon: "Heart",
      styles: {
        "--mark-bg": "#fff7ed",
        "--mark-border": "#fed7aa",
        "--mark-fg": "#9a3412",
      },
    },
  },
  {
    title: "Pill / Play",
    patch: {
      shape: "pill",
      sizeKey: "lg",
      icon: "Play",
      hoverIcon: "Pause",
      hoverAnim: "cycle",
      styles: {
        "--mark-bg": "#ecfeff",
        "--mark-border": "#a5f3fc",
        "--mark-fg": "#164e63",
      },
    },
  },
  {
    title: "Indigo / Check",
    patch: {
      icon: "Check",
      styles: {
        "--mark-bg": "#eef2ff",
        "--mark-border": "#c7d2fe",
        "--mark-fg": "#3730a3",
      },
    },
  },
  {
    title: "Amber / Star",
    patch: {
      icon: "Star",
      hoverAnim: "cycle",
      styles: {
        "--mark-bg": "#fffbeb",
        "--mark-border": "#fde68a",
        "--mark-fg": "#92400e",
      },
    },
  },
  {
    title: "Dark / Moon",
    patch: {
      icon: "Moon",
      hoverIcon: "Sun",
      styles: {
        "--mark-bg": "#0f172a",
        "--mark-border": "#334155",
        "--mark-fg": "#f8fafc",
      },
    },
  },
  {
    title: "Success / Check",
    patch: {
      shape: "rounded",
      icon: "Check",
      styles: {
        "--mark-bg": "#ecfdf5",
        "--mark-border": "#6ee7b7",
        "--mark-fg": "#065f46",
      },
    },
  },
  {
    title: "Danger / X",
    patch: {
      shape: "square",
      icon: "X",
      styles: {
        "--mark-bg": "#fef2f2",
        "--mark-border": "#fecaca",
        "--mark-fg": "#7f1d1d",
      },
    },
  },
];

/* =========================
   Snippet builder (solo JSX)
   ========================= */

function styleToSnippet(s: StyleVars): string {
  const pairs: string[] = [];
  if (s["--mark-bg"]) pairs.push(`"--mark-bg": "${s["--mark-bg"]}"`);
  if (s["--mark-border"])
    pairs.push(`"--mark-border": "${s["--mark-border"]}"`);
  if (s["--mark-fg"]) pairs.push(`"--mark-fg": "${s["--mark-fg"]}"`);
  return pairs.length ? `{ ${pairs.join(", ")} }` : "";
}

function boolAttr(name: string, val: boolean, def = false): string {
  if (val === def) return "";
  return val ? `${name}` : "";
}

function jsxOf(state: BuilderState): string {
  const props: string[] = [];

  const sizeVal =
    state.sizeChoice === "preset"
      ? `"${state.sizeKey}"`
      : `{${state.sizeNumber}}`;
  if (!(state.sizeChoice === "preset" && state.sizeKey === "md")) {
    props.push(`size=${sizeVal}`);
  }
  if (state.iconSize > 0) props.push(`iconSize={${state.iconSize}}`);
  if (state.shape !== "circle") props.push(`shape="${state.shape}"`);
  if (state.borderWidth !== 2) props.push(`borderWidth={${state.borderWidth}}`);

  const inter = boolAttr("interactive", state.interactive, true);
  if (inter) props.push(inter);
  const asBtn = boolAttr("asButton", state.asButton, false);
  if (asBtn) props.push(asBtn);
  const dis = boolAttr("disabled", state.disabled, false);
  if (dis) props.push(dis);

  if (state.asButton && state.buttonType !== "button") {
    props.push(`buttonType="${state.buttonType}"`);
  }
  if (state.title.trim()) props.push(`title="${state.title.trim()}"`);
  if (state.ariaLabel.trim())
    props.push(`ariaLabel="${state.ariaLabel.trim()}"`);

  if (state.hoverAnim !== "zoom") props.push(`hoverAnim="${state.hoverAnim}"`);
  if (state.zoomScale !== 1.06) props.push(`zoomScale={${state.zoomScale}}`);
  if (state.cycleOffset !== 10)
    props.push(`cycleOffset={${state.cycleOffset}}`);
  if (state.cycleAngleDeg !== 35)
    props.push(`cycleAngleDeg={${state.cycleAngleDeg}}`);
  if (state.cycleRotateDeg !== 14)
    props.push(`cycleRotateDeg={${state.cycleRotateDeg}}`);

  const styleStr = styleToSnippet(state.styles);
  if (styleStr) props.push(`style={${styleStr}}`);

  if (state.icon) props.push(`icon={<${state.icon} />}`);
  if (state.hoverIcon) props.push(`hoverIcon={<${state.hoverIcon} />}`);

  const join = props.length ? " " + props.join(" ") + " " : " ";
  return `<IconMark${join}/>`;
}

/* =========================
   Toast reutilizable
   ========================= */

function useToast(timeout: number = 1200): {
  show: (m: string) => void;
  node: React.ReactElement | null;
} {
  const [msg, setMsg] = React.useState<string | null>(null);
  const show = React.useCallback(
    (m: string) => {
      setMsg(m);
      setTimeout(() => setMsg(null), timeout);
    },
    [timeout]
  );
  const node = msg ? (
    <div className="fixed bottom-4 right-4 z-[10000] rounded-xl bg-zinc-900 text-white text-sm px-3 py-2 shadow-lg">
      {msg}
    </div>
  ) : null;
  return { show, node } as const;
}

/* =========================
   Modal simple
   ========================= */

function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}): React.ReactElement | null {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.documentElement.classList.toggle("overflow-hidden", open);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.documentElement.classList.remove("overflow-hidden");
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[10001]" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 grid place-items-center min-h-full p-4">
        <div
          className="w-full max-w-2xl rounded-2xl bg-white text-zinc-900 shadow-xl border border-zinc-200"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/* =========================
   Page
   ========================= */

export default function IconMarkDemoPage(): React.ReactElement {
  const [mode, setMode] = React.useState<"gallery" | "builder">("gallery");
  const [selected, setSelected] = React.useState<number>(0);
  const [state, setState] = React.useState<BuilderState>({ ...DEFAULTS });
  const [showCode, setShowCode] = React.useState(false);
  const { show: showToast, node: toastNode } = useToast();

  const selectPreset = (i: number): void => {
    setSelected(i);
    setState((s) => ({
      ...s,
      ...PRESETS[i].patch,
    }));
  };

  const snippet = jsxOf(state);

  // helper visual para inputs/selects
  const fieldCls =
    "h-9 rounded-md border px-2 " +
    "bg-white text-zinc-900 border-zinc-300 " +
    "dark:bg-zinc-800 dark:text-white dark:border-zinc-700 " +
    "placeholder:text-zinc-400 dark:placeholder:text-zinc-400";

  return (
    <main className="h-dvh md:h-screen p-6 md:p-10 grid content-start gap-6">
      <header className="grid gap-2">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-black">
          IconMark
        </h1>
      </header>

      {mode === "gallery" ? (
        <>
          {/* Acciones */}
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={() => setMode("builder")}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              Crear tu IconMark
            </button>
          </div>

          {/* Galería 3x3 */}
          <section className="grid gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {PRESETS.map((p, i) => {
                const s = { ...DEFAULTS, ...p.patch } as BuilderState;
                const code = jsxOf(s);
                const iconNode = ICONS[s.icon];
                const hoverIconNode = s.hoverIcon
                  ? ICONS[s.hoverIcon]
                  : undefined;
                const sizeProp: SizeKey | number =
                  s.sizeChoice === "preset" ? s.sizeKey : s.sizeNumber;

                return (
                  <VariantCard
                    key={p.title}
                    title={p.title}
                    selected={selected === i}
                    onSelect={() => selectPreset(i)}
                    code={code}
                    onCopy={() => showToast("Copiado")}
                  >
                    <IconMark
                      icon={iconNode}
                      hoverIcon={hoverIconNode}
                      size={sizeProp}
                      iconSize={s.iconSize || undefined}
                      shape={s.shape}
                      borderWidth={s.borderWidth}
                      interactive={s.interactive}
                      asButton={s.asButton}
                      disabled={s.disabled}
                      buttonType={s.buttonType}
                      title={s.title || undefined}
                      ariaLabel={s.ariaLabel || undefined}
                      hoverAnim={s.hoverAnim}
                      zoomScale={s.zoomScale}
                      cycleOffset={s.cycleOffset}
                      cycleAngleDeg={s.cycleAngleDeg}
                      cycleRotateDeg={s.cycleRotateDeg}
                      style={s.styles}
                    />
                  </VariantCard>
                );
              })}
            </div>
          </section>
        </>
      ) : (
        /* ===== Builder ===== */
        <section className="grid gap-6">
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={() => setMode("gallery")}
              className="px-5 py-2.5 rounded-2xl bg-zinc-900 text-white border border-zinc-800 shadow hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              ← Volver
            </button>
            <button
              type="button"
              onClick={() => setShowCode(true)}
              className="px-5 py-2.5 rounded-2xl bg-zinc-900 text-white border border-zinc-800 shadow hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              title="Ver código"
            >
              Ver código
            </button>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(snippet);
                showToast("Copiado");
              }}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
              title="Copiar JSX"
            >
              Copiar JSX
            </button>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 h-[calc(100dvh-12rem)]">
            {/* Controles */}
            <div className="rounded-2xl border bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 p-5 shadow-sm grid gap-5 content-start dark:text-white">
              {/* Size */}
              <fieldset className="grid gap-2">
                <label className="text-sm font-medium text-zinc-900 dark:text-white">
                  Tamaño
                </label>
                <div className="flex flex-wrap items-center gap-3">
                  <select
                    className={fieldCls + " cursor-pointer"}
                    value={state.sizeChoice}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        sizeChoice: e.target.value as SizeChoice,
                      }))
                    }
                    title="Tipo de tamaño"
                  >
                    <option value="preset">Preset</option>
                    <option value="number">Numérico</option>
                  </select>

                  {state.sizeChoice === "preset" ? (
                    <select
                      className={fieldCls + " cursor-pointer"}
                      value={state.sizeKey}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          sizeKey: e.target.value as SizeKey,
                        }))
                      }
                      title="Preset"
                    >
                      {[
                        "xs",
                        "sm",
                        "md",
                        "lg",
                        "xl",
                        "xxl",
                        "heroSm",
                        "hero",
                        "xxxl",
                      ].map((k) => (
                        <option key={k} value={k}>
                          {k}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="number"
                      className={fieldCls + " w-28"}
                      min={18}
                      max={500}
                      step={1}
                      value={state.sizeNumber}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          sizeNumber: Number(e.target.value),
                        }))
                      }
                    />
                  )}

                  <label className="ml-4 text-sm font-medium text-zinc-900 dark:text-white">
                    iconSize
                  </label>
                  <input
                    type="number"
                    className={fieldCls + " w-24"}
                    min={0}
                    max={420}
                    step={1}
                    value={state.iconSize}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        iconSize: Number(e.target.value),
                      }))
                    }
                    title="0 = auto"
                  />
                </div>
              </fieldset>

              {/* Shape / Border */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-zinc-900 dark:text-white">
                    Shape
                  </label>
                  <select
                    className={fieldCls + " cursor-pointer"}
                    value={state.shape}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        shape: e.target.value as Shape,
                      }))
                    }
                  >
                    <option value="circle">circle</option>
                    <option value="rounded">rounded</option>
                    <option value="square">square</option>
                    <option value="pill">pill</option>
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-zinc-900 dark:text-white">
                    Borde (px)
                  </label>
                  <input
                    type="number"
                    className={fieldCls + " w-full"}
                    min={0}
                    max={12}
                    step={1}
                    value={state.borderWidth}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        borderWidth: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>

              {/* Interacción */}
              <div className="grid grid-cols-2 gap-4">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="accent-indigo-500"
                    checked={state.interactive}
                    onChange={(e) =>
                      setState((s) => ({ ...s, interactive: e.target.checked }))
                    }
                  />
                  <span className="text-sm dark:text-white text-zinc-900">
                    interactive
                  </span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="accent-indigo-500"
                    checked={state.asButton}
                    onChange={(e) =>
                      setState((s) => ({ ...s, asButton: e.target.checked }))
                    }
                  />
                  <span className="text-sm dark:text-white text-zinc-900">
                    asButton
                  </span>
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    className="accent-indigo-500"
                    checked={state.disabled}
                    onChange={(e) =>
                      setState((s) => ({ ...s, disabled: e.target.checked }))
                    }
                  />
                  <span className="text-sm dark:text-white text-zinc-900">
                    disabled
                  </span>
                </label>
                <div className="grid grid-cols-[110px,1fr] items-center gap-2">
                  <label className="text-sm font-medium text-zinc-900 dark:text-white">
                    buttonType
                  </label>
                  <select
                    className={fieldCls + " cursor-pointer"}
                    value={state.buttonType}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        buttonType: e.target.value as
                          | "button"
                          | "submit"
                          | "reset",
                      }))
                    }
                  >
                    <option value="button">button</option>
                    <option value="submit">submit</option>
                    <option value="reset">reset</option>
                  </select>
                </div>
              </div>

              {/* A11y / Title */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-zinc-900 dark:text-white">
                    title
                  </label>
                  <input
                    type="text"
                    className={fieldCls + " w-full"}
                    value={state.title}
                    onChange={(e) =>
                      setState((s) => ({ ...s, title: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-zinc-900 dark:text-white">
                    ariaLabel
                  </label>
                  <input
                    type="text"
                    className={fieldCls + " w-full"}
                    value={state.ariaLabel}
                    onChange={(e) =>
                      setState((s) => ({ ...s, ariaLabel: e.target.value }))
                    }
                  />
                </div>
              </div>

              {/* Animations */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-zinc-900 dark:text-white">
                    hoverAnim
                  </label>
                  <select
                    className={fieldCls + " cursor-pointer"}
                    value={state.hoverAnim}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        hoverAnim: e.target.value as HoverAnim,
                      }))
                    }
                  >
                    <option value="none">none</option>
                    <option value="zoom">zoom</option>
                    <option value="cycle">cycle</option>
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div className="grid gap-1">
                    <label className="text-xs font-medium text-zinc-900 dark:text-white">
                      zoomScale
                    </label>
                    <input
                      type="number"
                      step={0.01}
                      className={fieldCls + " w-full"}
                      value={state.zoomScale}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          zoomScale: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-xs font-medium text-zinc-900 dark:text-white">
                      cycleOffset
                    </label>
                    <input
                      type="number"
                      className={fieldCls + " w-full"}
                      value={state.cycleOffset}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          cycleOffset: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-1">
                    <label className="text-xs font-medium text-zinc-900 dark:text-white">
                      cycleAngle
                    </label>
                    <input
                      type="number"
                      className={fieldCls + " w-full"}
                      value={state.cycleAngleDeg}
                      onChange={(e) =>
                        setState((s) => ({
                          ...s,
                          cycleAngleDeg: Number(e.target.value),
                        }))
                      }
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <label className="text-sm font-medium text-zinc-900 dark:text-white">
                    cycleRotateDeg
                  </label>
                  <input
                    type="number"
                    className={fieldCls + " w-full"}
                    value={state.cycleRotateDeg}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        cycleRotateDeg: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>

              {/* Colores (CSS vars) */}
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-1">
                  <label className="text-sm font-medium text-zinc-900 dark:text-white">
                    Fondo
                  </label>
                  <input
                    type="color"
                    className="h-10 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 cursor-pointer"
                    value={state.styles["--mark-bg"] || "#ffffff"}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        styles: { ...s.styles, ["--mark-bg"]: e.target.value },
                      }))
                    }
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm font-medium text-zinc-900 dark:text-white">
                    Borde
                  </label>
                  <input
                    type="color"
                    className="h-10 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 cursor-pointer"
                    value={state.styles["--mark-border"] || "#e5e7eb"}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        styles: {
                          ...s.styles,
                          ["--mark-border"]: e.target.value,
                        },
                      }))
                    }
                  />
                </div>
                <div className="grid gap-1">
                  <label className="text-sm font-medium text-zinc-900 dark:text-white">
                    Icono
                  </label>
                  <input
                    type="color"
                    className="h-10 w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 cursor-pointer"
                    value={state.styles["--mark-fg"] || "#0f172a"}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        styles: { ...s.styles, ["--mark-fg"]: e.target.value },
                      }))
                    }
                  />
                </div>
              </div>

              {/* Iconos */}
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-zinc-900 dark:text-white">
                    icon
                  </label>
                  <select
                    className={fieldCls + " cursor-pointer"}
                    value={state.icon}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        icon: e.target.value as IconKey,
                      }))
                    }
                  >
                    {Object.keys(ICONS).map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-sm font-medium text-zinc-900 dark:text-white">
                    hoverIcon
                  </label>
                  <select
                    className={fieldCls + " cursor-pointer"}
                    value={state.hoverIcon ?? ""}
                    onChange={(e) =>
                      setState((s) => ({
                        ...s,
                        hoverIcon: (e.target.value || undefined) as
                          | IconKey
                          | undefined,
                      }))
                    }
                  >
                    <option value="">(ninguno)</option>
                    {Object.keys(ICONS).map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="rounded-2xl border bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 p-5 grid place-items-center shadow-sm">
              <IconMark
                icon={ICONS[state.icon]}
                hoverIcon={state.hoverIcon ? ICONS[state.hoverIcon] : undefined}
                size={
                  state.sizeChoice === "preset"
                    ? state.sizeKey
                    : state.sizeNumber
                }
                iconSize={state.iconSize || undefined}
                shape={state.shape}
                borderWidth={state.borderWidth}
                interactive={state.interactive}
                asButton={state.asButton}
                disabled={state.disabled}
                buttonType={state.buttonType}
                title={state.title || undefined}
                ariaLabel={state.ariaLabel || undefined}
                hoverAnim={state.hoverAnim}
                zoomScale={state.zoomScale}
                cycleOffset={state.cycleOffset}
                cycleAngleDeg={state.cycleAngleDeg}
                cycleRotateDeg={state.cycleRotateDeg}
                style={state.styles}
              />
            </div>
          </div>
        </section>
      )}

      {/* Modal código */}
      <Modal open={showCode} onClose={() => setShowCode(false)}>
        <div className="p-4 grid gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Código JSX</h3>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(snippet);
                showToast("Copiado");
              }}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white shadow hover:shadow-lg cursor-pointer"
            >
              Copiar
            </button>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 font-mono text-sm text-zinc-900 overflow-x-auto">
            {snippet}
          </div>
        </div>
      </Modal>

      {toastNode}
    </main>
  );
}

/* =========================
   VariantCard
   ========================= */

type VariantCardProps = {
  title: string;
  children: React.ReactNode;
  selected?: boolean;
  onSelect?: () => void;
  code: string;
  onCopy?: () => void;
};

function VariantCard({
  title,
  children,
  selected,
  onSelect,
  code,
  onCopy,
}: VariantCardProps): React.ReactElement {
  const [copied, setCopied] = React.useState(false);

  return (
    <div
      className={[
        "relative rounded-2xl border bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 p-4 shadow-sm",
        "hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200",
        selected ? "ring-2 ring-indigo-500" : "ring-0",
      ].join(" ")}
    >
      <button
        type="button"
        onClick={onSelect}
        className="absolute inset-0 rounded-2xl cursor-pointer"
        aria-label={`Seleccionar ${title}`}
      />

      <button
        type="button"
        onClick={async (e) => {
          e.stopPropagation();
          await navigator.clipboard.writeText(code);
          setCopied(true);
          onCopy?.();
          setTimeout(() => setCopied(false), 1000);
        }}
        className="absolute top-3 right-3 size-9 grid place-items-center rounded-xl bg-zinc-900 text-white shadow hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
        aria-label="Copiar JSX"
        title={copied ? "Copiado" : "Copiar JSX"}
      >
        <Copy className="h-4 w-4" />
      </button>

      <div className="pointer-events-none h-36 grid place-items-center">
        {children}
      </div>
      <div className="mt-2 text-center text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {title}
      </div>
    </div>
  );
}
