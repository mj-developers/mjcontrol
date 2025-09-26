"use client";

import * as React from "react";
import MJSpinner, { MJSpinnerProps } from "@/components/ui/MJSpinner";
import { Copy, Code } from "lucide-react";

/* =========================
   Config / Tipos
   ========================= */

type BuilderProps = Pick<
  MJSpinnerProps,
  "size" | "thickness" | "speed" | "sweep" | "accent"
>;
type BuilderState = Required<BuilderProps>;

const DEFAULTS: BuilderState = {
  size: 72,
  thickness: 5,
  speed: 1100,
  sweep: 35,
  accent: "var(--brand, #8E2434)",
};

const PRESETS: Array<{ title: string; props: Partial<BuilderState> }> = [
  { title: "Compacto", props: { size: 48 } },
  { title: "Brand", props: { size: 72, thickness: 6, sweep: 40 } },
  { title: "Cyan rápido", props: { size: 84, speed: 900, accent: "#06B6D4" } },
  {
    title: "Indigo grueso",
    props: { size: 100, thickness: 7, sweep: 55, accent: "#6366F1" },
  },
  {
    title: "Thin veloz",
    props: { size: 88, thickness: 3, speed: 700, accent: "#10B981" },
  },
  { title: "Sweep amplio", props: { size: 96, sweep: 70, accent: "#F59E0B" } },
  { title: "Contraste", props: { size: 90, accent: "#EAB308" } },
  { title: "Clásico", props: { size: 80 } },
  {
    title: "Suave",
    props: { size: 76, sweep: 30, speed: 1400, accent: "#22D3EE" },
  },
];

/* =========================
   Utilidades
   ========================= */

function buildJSXProps(props: BuilderState): string {
  const entries: string[] = [];
  (Object.keys(props) as (keyof BuilderState)[]).forEach((k) => {
    const val = props[k];
    const defaultsIndex = DEFAULTS as Record<keyof BuilderState, unknown>;
    if (defaultsIndex[k] === val) return;
    if (typeof val === "string") entries.push(`${k}="${val}"`);
    else if (typeof val === "number") entries.push(`${k}={${val}}`);
  });
  return entries.join(" ");
}

function jsxOnly(props: BuilderState): string {
  const attrs = buildJSXProps(props);
  return attrs ? `<MJSpinner ${attrs} />` : `<MJSpinner />`;
}

/* =========================
   Toast
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
   Modal sencillo
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
   PAGE
   ========================= */

export default function SpinnerPage(): React.ReactElement {
  const [mode, setMode] = React.useState<"gallery" | "builder">("gallery");
  const [showOverlay, setShowOverlay] = React.useState(false);
  const [selected, setSelected] = React.useState<number>(0);
  const { show: showToast, node: toastNode } = useToast();

  const [builder, setBuilder] = React.useState<BuilderState>({ ...DEFAULTS });
  const update = (patch: Partial<BuilderState>) =>
    setBuilder((s) => ({ ...s, ...patch }));

  const selectedProps: BuilderState = {
    ...DEFAULTS,
    ...PRESETS[selected]?.props,
  } as BuilderState;

  const [showCodeModal, setShowCodeModal] = React.useState(false);

  return (
    <main className="h-dvh md:h-screen p-6 md:p-10 grid content-start gap-6">
      <header className="grid gap-2">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight text-black">
          MJSpinner
        </h1>
      </header>

      {mode === "gallery" ? (
        <>
          {/* Botones centrados */}
          <div className="flex justify-center gap-4">
            <button
              type="button"
              onClick={() => setMode("builder")}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              Crear tu spinner
            </button>
            <button
              type="button"
              onClick={() => setShowOverlay(true)}
              className="px-5 py-2.5 rounded-2xl bg-zinc-900 text-white border border-zinc-800 shadow hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              Probar overlay
            </button>
          </div>

          {/* Ocultamos el grid completamente si hay overlay */}
          {!showOverlay && (
            <section className="grid gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {PRESETS.map((p, i) => {
                  const props = { ...DEFAULTS, ...p.props } as BuilderState;
                  return (
                    <VariantCard
                      key={p.title}
                      title={p.title}
                      selected={selected === i}
                      onSelect={() => setSelected(i)}
                      code={jsxOnly(props)}
                      onCopy={() => showToast("Copiado")}
                    >
                      <MJSpinner {...props} />
                    </VariantCard>
                  );
                })}
              </div>
            </section>
          )}
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
          </div>

          <div className="grid lg:grid-cols-2 gap-6 h-[calc(100dvh-12rem)]">
            {/* Controles */}
            <div className="rounded-2xl border bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 p-5 shadow-sm">
              <div className="grid gap-5">
                <SliderWithNumber
                  label="Tamaño"
                  min={32}
                  max={200}
                  step={1}
                  value={Number(builder.size)}
                  onChange={(v) => update({ size: v })}
                  suffix="px"
                />
                <SliderWithNumber
                  label="Grosor del aro"
                  min={2}
                  max={12}
                  step={1}
                  value={builder.thickness}
                  onChange={(v) => update({ thickness: v })}
                  suffix="px"
                />
                <SliderWithNumber
                  label="Sweep (arco visible)"
                  min={5}
                  max={95}
                  step={1}
                  value={builder.sweep}
                  onChange={(v) => update({ sweep: v })}
                  suffix="%"
                />
                <SliderWithNumber
                  label="Velocidad (aro)"
                  min={400}
                  max={3000}
                  step={50}
                  value={builder.speed}
                  onChange={(v) => update({ speed: v })}
                  suffix="ms"
                />

                <div className="flex items-end gap-4">
                  <Control label="Acento">
                    <input
                      type="color"
                      value={
                        builder.accent?.startsWith("var(")
                          ? "#8E2434"
                          : (builder.accent as string)
                      }
                      onChange={(e) => update({ accent: e.target.value })}
                      className="h-10 w-28 rounded-md border border-zinc-300 dark:border-zinc-700 bg-white cursor-pointer"
                    />
                  </Control>

                  <div className="ml-auto flex gap-3">
                    <button
                      type="button"
                      onClick={() => setBuilder({ ...DEFAULTS })}
                      className="px-4 py-2 rounded-2xl bg-white text-zinc-900 border border-zinc-300 shadow hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowOverlay(true)}
                      className="px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all cursor-pointer"
                    >
                      Probar overlay
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Vista previa + acciones */}
            <div className="rounded-2xl border bg-white border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800 p-5 grid gap-4 shadow-sm relative">
              <div className="absolute top-3 right-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCodeModal(true)}
                  className="size-9 grid place-items-center rounded-xl bg-zinc-900 text-white shadow hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
                  aria-label="Ver código"
                  title="Ver código"
                >
                  <Code className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(jsxOnly(builder));
                    showToast("Copiado");
                  }}
                  className="size-9 grid place-items-center rounded-xl bg-zinc-900 text-white shadow hover:shadow-lg hover:-translate-y-0.5 transition-all cursor-pointer"
                  aria-label="Copiar JSX"
                  title="Copiar JSX"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1 min-h-0 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 grid place-items-center">
                <MJSpinner {...builder} />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Overlay */}
      {showOverlay && (
        <div onClick={() => setShowOverlay(false)}>
          {mode === "gallery" ? (
            <MJSpinner overlay {...selectedProps} />
          ) : (
            <MJSpinner overlay {...builder} />
          )}
        </div>
      )}

      {/* Modal código */}
      <Modal open={showCodeModal} onClose={() => setShowCodeModal(false)}>
        <div className="p-4 grid gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Código JSX</h3>
            <button
              type="button"
              onClick={async () => {
                await navigator.clipboard.writeText(jsxOnly(builder));
                showToast("Copiado");
              }}
              className="px-3 py-1.5 rounded-lg bg-zinc-900 text-white shadow hover:shadow-lg cursor-pointer"
            >
              Copiar
            </button>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 font-mono text-sm text-zinc-900 overflow-x-auto">
            {jsxOnly(builder)}
          </div>
        </div>
      </Modal>

      {toastNode}
    </main>
  );
}

/* =========================
   Subcomponentes
   ========================= */

function Control({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
        {label}
      </label>
      {children}
    </div>
  );
}

function SliderWithNumber({
  label,
  min,
  max,
  step,
  value,
  onChange,
  suffix,
}: {
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
}): React.ReactElement {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-200">
          {label}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={value}
            min={min}
            max={max}
            step={step}
            onChange={(e) => onChange(Number(e.target.value))}
            className="h-9 w-24 rounded-md border px-2 border-zinc-300 dark:border-zinc-700 bg-white text-zinc-900"
          />
          {suffix && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              {suffix}
            </span>
          )}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full cursor-pointer"
      />
    </div>
  );
}

function VariantCard({
  title,
  children,
  selected,
  onSelect,
  code,
  onCopy,
}: {
  title: string;
  children: React.ReactNode;
  selected?: boolean;
  onSelect?: () => void;
  code: string;
  onCopy?: () => void;
}): React.ReactElement {
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
