"use client";
import { useRef, useLayoutEffect } from "react";

type Props = {
  accent?: string;
  count?: number;
  linkDist?: number;
  speed?: number;

  bg?: string;
  logo?: string;
  logoSize?: number;
  logoYOffset?: number;

  showRing?: boolean;
  ringRadius?: number;
  ringAlpha?: number;
  ringStrokeAlpha?: number;
  ringStrokeWidth?: number;
  mouseMode?: "attract" | "repel";
  repelStrength?: number;
  pointAlpha?: number;

  circleBg?: string;
  circleBorder?: string;
  circleBorderWidth?: number;

  lineBaseColor?: string;
  lineBaseAlpha?: number;

  showCenter?: boolean;
};

type Pt = { x: number; y: number; vx: number; vy: number };

export default function ParticleLinks({
  accent = "#8E2434",
  count = 78,
  linkDist = 160,
  speed = 60,

  bg = "#E2E5EA",
  logo = "/LogoMJDevsDark.svg",
  logoSize = 460,
  logoYOffset = -0.06,

  showRing = false,
  ringRadius = 120,
  ringAlpha = 0.1,
  ringStrokeAlpha = 0.6,
  ringStrokeWidth = 1.6,
  mouseMode = "attract",
  repelStrength = 22,
  pointAlpha = 0.85,

  circleBg = "#0B0B0D",
  circleBorder = "#ffffff",
  circleBorderWidth = 4,

  lineBaseColor = "#111111",
  lineBaseAlpha = 0.16,

  showCenter = true,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const circleRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);

  useLayoutEffect(() => {
    const wrap = wrapRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;

    let W = 0,
      H = 0,
      raf = 0,
      running = true;
    let CX = 0,
      CY = 0,
      CR = 0;

    const pts: Pt[] = [];
    const mouse = { x: 0, y: 0, has: false };

    const wander = 6;
    const mouseRadius = ringRadius;
    const attractStrength = 20;
    const maxSpeed = speed * 1.25;

    function fit() {
      const r = wrap.getBoundingClientRect();
      // Dimensiones CSS (en px lógicas)
      W = Math.max(1, Math.floor(r.width || window.innerWidth));
      H = Math.max(1, Math.floor(r.height || window.innerHeight));

      // Limitar DPI y tamaño físico del canvas para evitar errores del navegador
      const MAX_DIM = 8192; // por lado
      const dpr = Math.min(window.devicePixelRatio || 1, 2); // no más de 2x

      const pxW = Math.min(Math.floor(W * dpr), MAX_DIM);
      const pxH = Math.min(Math.floor(H * dpr), MAX_DIM);

      canvas.width = pxW;
      canvas.height = pxH;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;

      // Factor de escala REAL (puede ser < dpr si pinchó en el clamp)
      const sx = pxW / W;
      const sy = pxH / H;
      ctx.setTransform(sx, 0, 0, sy, 0, 0);

      if (!pts.length) seed();
      if (showCenter) layoutCircle();
    }

    function layoutCircle() {
      const circle = circleRef.current!;
      const img = logoRef.current!;

      const cx = W / 2;
      const cy = H / 2;
      const D = Math.max(220, Math.min(logoSize, Math.min(W, H) * 0.68));
      CX = cx;
      CY = cy;
      CR = D / 2;

      circle.style.width = `${D}px`;
      circle.style.height = `${D}px`;
      circle.style.left = `${cx}px`;
      circle.style.top = `${cy}px`;
      circle.style.background = circleBg;
      circle.style.border = "none";
      circle.style.boxShadow = `0 18px 40px rgba(0,0,0,.20), 0 0 0 ${circleBorderWidth}px ${circleBorder}`;
      circle.style.opacity = "1";

      const yOffsetPx = logoYOffset * D;
      img.style.maxWidth = `${Math.floor(D * 0.72)}px`;
      img.style.maxHeight = `${Math.floor(D * 0.72)}px`;
      img.style.left = `${cx}px`;
      img.style.top = `${cy + yOffsetPx}px`;
      img.style.opacity = "1";
    }

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

    const clamp = (v: number, a: number, b: number) =>
      Math.max(a, Math.min(b, v));
    const hexWithAlpha = (hex: string, a: number) => {
      let c = hex.replace("#", "");
      if (c.length === 3)
        c = c
          .split("")
          .map((ch) => ch + ch)
          .join("");
      const n = parseInt(c, 16);
      const r = (n >> 16) & 255,
        g = (n >> 8) & 255,
        b = n & 255;
      return `rgba(${r},${g},${b},${clamp(a, 0, 1)})`;
    };

    function step(dt: number) {
      for (const p of pts) {
        p.vx += (Math.random() - 0.5) * wander * dt;
        p.vy += (Math.random() - 0.5) * wander * dt;

        if (mouse.has) {
          const dx = mouse.x - p.x;
          const dy = mouse.y - p.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < mouseRadius * mouseRadius) {
            const d = Math.sqrt(d2) + 1e-4;
            const t = 1 - d / mouseRadius;
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

            ctx.strokeStyle = hexWithAlpha(lineBaseColor, lineBaseAlpha * t);
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();

            if ((i + j) % 7 === 0 && t > 0.6) {
              const wave = 0.5 + 0.5 * Math.sin(time * 0.8 + i * 0.33);
              const aAcc = clamp((t - 0.6) / 0.4, 0, 1) * (0.12 + 0.18 * wave);
              ctx.strokeStyle = hexWithAlpha(accent, aAcc);
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
      ctx.fillStyle = hexWithAlpha(accent, pointAlpha);
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
      g.addColorStop(0, hexWithAlpha(accent, 0));
      g.addColorStop(1, hexWithAlpha(accent, ringAlpha));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.lineWidth = ringStrokeWidth;
      ctx.strokeStyle = hexWithAlpha(accent, ringStrokeAlpha);
      ctx.beginPath();
      ctx.arc(mouse.x, mouse.y, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // loop
    let last = performance.now();
    function loop(now: number) {
      if (!running) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      step(dt);

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      drawBackgroundDots();
      drawLinks(now / 1000);
      drawPoints();
      drawMouseRing();

      raf = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(fit);
    ro.observe(wrap);

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

    fit();
    raf = requestAnimationFrame(loop);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      wrap.removeEventListener("mousemove", onMouse);
      wrap.removeEventListener("mouseleave", onLeave);
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [
    accent,
    count,
    linkDist,
    speed,
    bg,
    logo,
    logoSize,
    logoYOffset,
    showRing,
    ringRadius,
    ringAlpha,
    ringStrokeAlpha,
    ringStrokeWidth,
    mouseMode,
    repelStrength,
    pointAlpha,
    circleBg,
    circleBorder,
    circleBorderWidth,
    lineBaseColor,
    lineBaseAlpha,
    showCenter,
  ]);

  return (
    <div
      ref={wrapRef}
      className="absolute inset-0"
      style={{ backgroundColor: bg }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full select-none"
        style={{ pointerEvents: "auto" }}
        aria-hidden="true"
      />
      {showCenter && (
        <>
          <div
            ref={circleRef}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none opacity-0 transition-opacity duration-200"
            aria-hidden="true"
          />
          <img
            suppressHydrationWarning
            ref={logoRef}
            src={logo}
            alt="MJ Devs"
            className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-0 transition-opacity duration-200"
            style={{ filter: "drop-shadow(0 6px 18px rgba(0,0,0,.18))" }}
            aria-hidden="true"
          />
        </>
      )}
    </div>
  );
}
