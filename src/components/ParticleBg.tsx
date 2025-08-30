"use client";
import { useRef, useLayoutEffect } from "react";

type MouseMode = "attract" | "repel";

type Props = {
  /** Densidad/velocidad/alcance */
  count?: number;
  linkDist?: number;
  speed?: number;

  /** Interacción con el ratón (opcional) */
  showRing?: boolean;
  ringRadius?: number;
  mouseMode?: MouseMode;
  repelStrength?: number;

  /** Montaje */
  className?: string;
  style?: React.CSSProperties;
  /** Si true, rellena el contenedor */
  fill?: boolean;

  /** Nombre del CustomEvent para cambios de tema (tu setThemeGlobal lo emite) */
  themeEventName?: string;

  /** Desactivar puntitos de fondo */
  backgroundDots?: boolean;
};

type Pt = { x: number; y: number; vx: number; vy: number };

/** Lee una CSS var del propio wrapper con fallback */
function readVar(el: Element, name: string, fallback: string): string {
  const v = getComputedStyle(el).getPropertyValue(name);
  return v && v.trim().length ? v.trim() : fallback;
}
function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
function hexWithAlpha(hex: string, a: number) {
  let c = hex.replace("#", "");
  if (c.length === 3)
    c = c
      .split("")
      .map((ch) => ch + ch)
      .join("");
  if (!/^[0-9a-fA-F]{6}$/.test(c)) return hex; // si no es hex, devuelve tal cual
  const n = parseInt(c, 16);
  const r = (n >> 16) & 255,
    g = (n >> 8) & 255,
    b = n & 255;
  return `rgba(${r},${g},${b},${clamp(a, 0, 1)})`;
}

export default function ParticleBg({
  count = 78,
  linkDist = 160,
  speed = 60,

  showRing = false,
  ringRadius = 120,
  mouseMode = "attract",
  repelStrength = 22,

  className,
  style,
  fill = false,
  themeEventName = "mj:theme",
  backgroundDots = true,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    // Tokens de color/alpha
    const tokens = {
      bg: "#E2E5EA",
      linkColor: "#3A3A3A",
      linkAlpha: 0.16,
      accent: "#8E2434",
      pointAlpha: 0.85,
      ringAlpha: 0.1,
      ringStrokeAlpha: 0.6,
    };

    function readTokens() {
      tokens.bg = readVar(wrap, "--pl-bg", tokens.bg);
      tokens.linkColor = readVar(wrap, "--pl-link-color", tokens.linkColor);
      tokens.linkAlpha =
        parseFloat(readVar(wrap, "--pl-link-alpha", `${tokens.linkAlpha}`)) ||
        tokens.linkAlpha;
      tokens.accent = readVar(wrap, "--pl-accent", tokens.accent);
      tokens.pointAlpha =
        parseFloat(readVar(wrap, "--pl-point-alpha", `${tokens.pointAlpha}`)) ||
        tokens.pointAlpha;
      tokens.ringAlpha =
        parseFloat(readVar(wrap, "--pl-ring-alpha", `${tokens.ringAlpha}`)) ||
        tokens.ringAlpha;
      tokens.ringStrokeAlpha =
        parseFloat(
          readVar(wrap, "--pl-ring-stroke-alpha", `${tokens.ringStrokeAlpha}`)
        ) || tokens.ringStrokeAlpha;
    }

    // Estado interno
    let W = 0,
      H = 0; // tamaño actual en CSS px
    let raf = 0;
    let running = true;
    const pts: Pt[] = [];
    const mouse = { x: 0, y: 0, has: false };

    const wander = 6;
    const mouseR = ringRadius;
    const attractStrength = 20;
    const maxSpeed = speed * 1.25;

    // Siembra inicial/forzada
    function seed() {
      pts.length = 0;
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const s = speed * (0.7 + Math.random() * 0.6);
        pts.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: Math.cos(ang) * s,
          vy: Math.sin(ang) * s,
        });
      }
    }

    // Ajusta canvas y decide resembrar o reescalar
    function fit() {
      readTokens();

      const r = wrap.getBoundingClientRect();
      const newW = Math.max(1, Math.floor(r.width || window.innerWidth));
      const newH = Math.max(1, Math.floor(r.height || window.innerHeight));

      // Canvas backing store (DPR cap 2)
      const MAX_DIM = 8192;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const pxW = Math.min(Math.floor(newW * dpr), MAX_DIM);
      const pxH = Math.min(Math.floor(newH * dpr), MAX_DIM);

      canvas.width = pxW;
      canvas.height = pxH;
      canvas.style.width = `${newW}px`;
      canvas.style.height = `${newH}px`;

      const sx = pxW / newW;
      const sy = pxH / newH;
      ctx.setTransform(sx, 0, 0, sy, 0, 0);

      // Decidir acción sobre las partículas
      const hadSize = W > 0 && H > 0;
      const orientationChanged = hadSize ? W > H !== newW > newH : true;
      const areaChangedRatio = hadSize
        ? Math.abs(newW * newH - W * H) / (W * H)
        : 1;

      // guarda tamaño nuevo
      const prevW = W,
        prevH = H;
      W = newW;
      H = newH;

      if (!hadSize) {
        seed(); // primera vez
        return;
      }

      // Umbral: si cambia orientación o el área cambia mucho, resembramos
      if (orientationChanged || areaChangedRatio > 0.15) {
        seed();
      } else {
        // Cambio pequeño ⇒ reescala posiciones para cubrir todo ya
        const kx = prevW ? newW / prevW : 1;
        const ky = prevH ? newH / prevH : 1;
        for (const p of pts) {
          p.x *= kx;
          p.y *= ky;
        }
      }
    }

    function step(dt: number) {
      for (const p of pts) {
        p.vx += (Math.random() - 0.5) * wander * dt;
        p.vy += (Math.random() - 0.5) * wander * dt;

        if (mouse.has) {
          const dx = mouse.x - p.x,
            dy = mouse.y - p.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < mouseR * mouseR) {
            const d = Math.sqrt(d2) + 1e-4;
            const t = 1 - d / mouseR;
            if (mouseMode === "repel") {
              const f = repelStrength * t;
              p.vx -= (dx / d) * f * dt;
              p.vy -= (dy / d) * f * dt;
            } else {
              const f = attractStrength * t;
              p.vx += (dx / d) * f * dt;
              p.vy += (dy / d) * f * dt;
            }
          }
        }

        const sp = Math.hypot(p.vx, p.vy);
        if (sp > maxSpeed) {
          const k = maxSpeed / sp;
          p.vx *= k;
          p.vy *= k;
        }

        p.x += p.vx * dt;
        p.y += p.vy * dt;
        if (p.x < -10) p.x = W + 10;
        if (p.x > W + 10) p.x = -10;
        if (p.y < -10) p.y = H + 10;
        if (p.y > H + 10) p.y = -10;
      }
    }

    function drawBackgroundDots() {
      if (!backgroundDots) return;
      ctx.fillStyle = "rgba(17,17,17,0.04)";
      const step = 64;
      for (let y = 0; y < H; y += step)
        for (let x = 0; x < W; x += step) ctx.fillRect(x, y, 1, 1);
    }

    function drawLinks(time: number) {
      ctx.lineWidth = 1.4;
      for (let i = 0; i < pts.length; i++) {
        for (let j = i + 1; j < pts.length; j++) {
          const a = pts[i],
            b = pts[j];
          const dx = a.x - b.x,
            dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < linkDist * linkDist) {
            const d = Math.sqrt(d2);
            const t = 1 - d / linkDist;

            ctx.strokeStyle = hexWithAlpha(
              tokens.linkColor,
              tokens.linkAlpha * t
            );
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();

            if ((i + j) % 7 === 0 && t > 0.6) {
              const wave = 0.5 + 0.5 * Math.sin(time * 0.8 + i * 0.33);
              const aAcc = clamp((t - 0.6) / 0.4, 0, 1) * (0.12 + 0.18 * wave);
              ctx.strokeStyle = hexWithAlpha(tokens.accent, aAcc);
              ctx.lineWidth = 2.1;
              ctx.beginPath();
              ctx.moveTo(a.x, a.y);
              ctx.lineTo(b.x, b.y);
              ctx.stroke();
              ctx.lineWidth = 1.4;
            }
          }
        }
      }
    }

    function drawPoints() {
      ctx.fillStyle = hexWithAlpha(tokens.accent, tokens.pointAlpha);
      for (const p of pts) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function drawMouseRing() {
      if (!showRing || !mouse.has) return;
      const r = ringRadius;
      const g = ctx.createRadialGradient(
        mouse.x,
        mouse.y,
        r * 0.6,
        mouse.x,
        mouse.y,
        r
      );
      g.addColorStop(0, hexWithAlpha(tokens.accent, 0));
      g.addColorStop(1, hexWithAlpha(tokens.accent, tokens.ringAlpha));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = 1.6;
      ctx.strokeStyle = hexWithAlpha(tokens.accent, tokens.ringStrokeAlpha);
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    let last = performance.now();
    function loop(now: number) {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      step(dt);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = tokens.bg;
      ctx.fillRect(0, 0, W, H);

      drawBackgroundDots();
      drawLinks(now / 1000);
      drawPoints();
      drawMouseRing();

      raf = requestAnimationFrame(loop);
    }

    // Observa el wrapper (cambios de tamaño ⇒ fit)
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);

    // Forzar re-seed al cambiar orientación en móviles/tablets
    const onOrientation = () => {
      seed();
      // también ajustamos canvas al nuevo tamaño inmediatamente
      fit();
    };
    window.addEventListener("orientationchange", onOrientation);

    // Eventos de ratón
    function onMouse(e: MouseEvent) {
      const r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
      mouse.has = true;
    }
    function onLeave() {
      mouse.has = false;
    }
    wrap.addEventListener("mousemove", onMouse);
    wrap.addEventListener("mouseleave", onLeave);

    // Pausa/reanuda con la pestaña
    const onVis = () => {
      running = !document.hidden;
      if (running) {
        last = performance.now();
        raf = requestAnimationFrame(loop);
      } else {
        cancelAnimationFrame(raf);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    // Cambios de tema
    const onTheme = () => {
      readTokens();
    };
    window.addEventListener(themeEventName, onTheme as EventListener);

    // Inicializa
    fit();
    const id = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("orientationchange", onOrientation);
      window.removeEventListener(themeEventName, onTheme as EventListener);
      document.removeEventListener("visibilitychange", onVis);
      wrap.removeEventListener("mousemove", onMouse);
      wrap.removeEventListener("mouseleave", onLeave);
      ro.disconnect();
      cancelAnimationFrame(id);
      cancelAnimationFrame(raf);
    };
  }, [
    count,
    linkDist,
    speed,
    showRing,
    ringRadius,
    mouseMode,
    repelStrength,
    themeEventName,
    backgroundDots,
  ]);

  return (
    <div
      ref={wrapRef}
      className={[
        fill ? "absolute inset-0" : "",
        "pointer-events-auto",
        className || "",
      ].join(" ")}
      style={style}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full select-none"
        aria-hidden="true"
      />
    </div>
  );
}
