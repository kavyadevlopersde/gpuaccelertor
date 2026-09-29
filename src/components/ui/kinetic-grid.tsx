"use client";

import React, {
  useEffect,
  useRef,
  useImperativeHandle,
  forwardRef,
  ReactNode,
} from "react";
import { cn } from "@/src/lib/utils";

export interface Point {
  x: number;
  y: number;
}

export interface Ripple {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  born: number;
}

export interface KineticGridHandle {
  triggerRipple: (x?: number, y?: number) => void;
  resetMouse: () => void;
}

export type GlobalTheme = "default" | "monochrome" | "emerald" | "violet";

export interface KineticGridProps {
  children?: ReactNode;
  className?: string;
  globalColor?: GlobalTheme;
  cellSize?: number;
  influenceRadius?: number;
  maxWarp?: number;
  lerpSpeed?: number;
  showDots?: boolean;
}

export const KineticGrid = forwardRef<KineticGridHandle, KineticGridProps>(
  (
    {
      children,
      className,
      globalColor = "default",
      cellSize = 55,
      influenceRadius = 260,
      maxWarp = 24,
      lerpSpeed = 0.08,
      showDots = true,
    },
    ref
  ) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const mouseRef = useRef<Point>({ x: -9999, y: -9999 });
    const targetMouseRef = useRef<Point>({ x: -9999, y: -9999 });
    const ripplesRef = useRef<Ripple[]>([]);

    const triggerRipple = (x?: number, y?: number) => {
      const rx = x !== undefined ? x : window.innerWidth / 2;
      const ry = y !== undefined ? y : window.innerHeight / 2;
      ripplesRef.current.push({
        x: rx,
        y: ry,
        radius: 0,
        opacity: 1,
        born: performance.now(),
      });
    };

    const resetMouse = () => {
      mouseRef.current = { x: -9999, y: -9999 };
      targetMouseRef.current = { x: -9999, y: -9999 };
    };

    useImperativeHandle(ref, () => ({
      triggerRipple,
      resetMouse,
    }));

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      let animationFrameId: number;
      let width = window.innerWidth;
      let height = window.innerHeight;

      const handleResize = () => {
        width = window.innerWidth;
        height = window.innerHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.resetTransform();
        ctx.scale(dpr, dpr);
      };

      handleResize();
      window.addEventListener("resize", handleResize);

      const handleMouseMove = (e: MouseEvent) => {
        targetMouseRef.current.x = e.clientX;
        targetMouseRef.current.y = e.clientY;
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length > 0) {
          targetMouseRef.current.x = e.touches[0].clientX;
          targetMouseRef.current.y = e.touches[0].clientY;
        }
      };

      const handleClick = (e: MouseEvent) => {
        triggerRipple(e.clientX, e.clientY);
      };

      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("touchmove", handleTouchMove, { passive: true });
      window.addEventListener("click", handleClick);

      const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;

      const lerpColor = (
        base: { r: number; g: number; b: number; a: number },
        active: { r: number; g: number; b: number; a: number },
        t: number
      ) => {
        const r = Math.round(lerpN(base.r, active.r, t));
        const g = Math.round(lerpN(base.g, active.g, t));
        const b = Math.round(lerpN(base.b, active.b, t));
        const a = lerpN(base.a, active.a, t);
        return `rgba(${r},${g},${b},${a.toFixed(3)})`;
      };

      const LINE_BASE = { r: 255, g: 255, b: 255, a: 0.13 };
      const NODE_BASE_RADIUS = 1.8;
      const NODE_ACTIVE_RADIUS = 3.2;
      const DOT_SPACING = 28;

      const themes = {
        default: {
          bg: "#161618",
          lineActive: { r: 74, g: 158, b: 255, a: 0.9 },
          nodeActive: { r: 74, g: 158, b: 255, a: 1.0 },
          glow: "74,158,255",
          ripple: "100,180,255",
        },
        monochrome: {
          bg: "#000000",
          lineActive: { r: 255, g: 255, b: 255, a: 0.9 },
          nodeActive: { r: 255, g: 255, b: 255, a: 1.0 },
          glow: "255,255,255",
          ripple: "255,255,255",
        },
        emerald: {
          bg: "#0a120e",
          lineActive: { r: 52, g: 211, b: 153, a: 0.9 },
          nodeActive: { r: 52, g: 211, b: 153, a: 1.0 },
          glow: "52,211,153",
          ripple: "110,231,183",
        },
        violet: {
          bg: "#100d1c",
          lineActive: { r: 167, g: 139, b: 250, a: 0.9 },
          nodeActive: { r: 167, g: 139, b: 250, a: 1.0 },
          glow: "167,139,250",
          ripple: "196,181,253",
        },
      };

      function getWarpedPoint(
        gx: number,
        gy: number,
        col: number,
        row: number,
        cols: number,
        rows: number
      ) {
        const edgeMargin = 1.5;
        const colPin = Math.min(
          col / edgeMargin,
          (cols - 1 - col) / edgeMargin,
          1
        );
        const rowPin = Math.min(
          row / edgeMargin,
          (rows - 1 - row) / edgeMargin,
          1
        );
        const pinFactor = colPin * colPin * rowPin * rowPin;

        const currentMouse = mouseRef.current;
        const dx = gx - currentMouse.x;
        const dy = gy - currentMouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const proximity =
          Math.max(0, 1 - dist / influenceRadius) * pinFactor;

        let rx = 0,
          ry = 0;
        const ripples = ripplesRef.current;
        for (let i = 0; i < ripples.length; i++) {
          const r = ripples[i];
          const rdx = gx - r.x;
          const rdy = gy - r.y;
          const rdist = Math.sqrt(rdx * rdx + rdy * rdy);
          const waveWidth = 55;
          const diff = rdist - r.radius;
          if (Math.abs(diff) < waveWidth) {
            const strength =
              (1 - Math.abs(diff) / waveWidth) * r.opacity * 18 * pinFactor;
            const angle = Math.atan2(rdy, rdx);
            const sign = diff < 0 ? -1 : 1;
            rx += Math.cos(angle) * strength * sign * -1;
            ry += Math.sin(angle) * strength * sign * -1;
          }
        }

        if (dist < influenceRadius && dist > 0 && pinFactor > 0) {
          const t = dist / influenceRadius;
          const eased =
            t < 0.01 ? 0 : (1 - t) * (1 - t) * Math.min(1, dist / 60);
          const warpAmt = eased * maxWarp * pinFactor;
          const angle = Math.atan2(dy, dx);
          return {
            pt: {
              x: gx - Math.cos(angle) * warpAmt + rx,
              y: gy - Math.sin(angle) * warpAmt + ry,
            },
            proximity,
          };
        }
        return { pt: { x: gx + rx, y: gy + ry }, proximity };
      }

      const draw = (now: number) => {
        const W = width;
        const H = height;
        const activeTheme = themes[globalColor] || themes.default;

        ctx.clearRect(0, 0, W, H);
        ctx.fillStyle = activeTheme.bg;
        ctx.fillRect(0, 0, W, H);

        // Dot background texture
        if (showDots) {
          ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
          for (let x = DOT_SPACING / 2; x < W; x += DOT_SPACING) {
            for (let y = DOT_SPACING / 2; y < H; y += DOT_SPACING) {
              ctx.beginPath();
              ctx.arc(x, y, 0.7, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }

        // Update ripples
        const ripples = ripplesRef.current;
        for (let i = ripples.length - 1; i >= 0; i--) {
          const r = ripples[i];
          const age = (now - r.born) / 1000;
          r.radius = Math.max(0, age * 400);
          r.opacity = Math.max(0, 1 - age * 1.2);
          if (r.opacity <= 0) ripples.splice(i, 1);
        }

        // Warped grid computation
        const cols = Math.max(2, Math.ceil(W / cellSize)) + 1;
        const rows = Math.max(2, Math.ceil(H / cellSize)) + 1;
        const cellW = W / (cols - 1);
        const cellH = H / (rows - 1);
        const pts: Point[][] = [];
        const prox: number[][] = [];

        for (let row = 0; row < rows; row++) {
          pts[row] = [];
          prox[row] = [];
          for (let col = 0; col < cols; col++) {
            const res = getWarpedPoint(
              col * cellW,
              row * cellH,
              col,
              row,
              cols,
              rows
            );
            pts[row][col] = res.pt;
            prox[row][col] = res.proximity;
          }
        }

        // Grid lines drawing
        const drawSeg = (
          p1: Point,
          p2: Point,
          pr1: number,
          pr2: number
        ) => {
          const avg = (pr1 + pr2) / 2;
          const t = avg * avg * (3 - 2 * avg);
          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.strokeStyle = lerpColor(LINE_BASE, activeTheme.lineActive, t);
          ctx.lineWidth = lerpN(0.8, 1.5, t);
          ctx.stroke();
        };

        ctx.lineCap = "butt";
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols - 1; col++) {
            drawSeg(
              pts[row][col],
              pts[row][col + 1],
              prox[row][col],
              prox[row][col + 1]
            );
          }
        }
        for (let col = 0; col < cols; col++) {
          for (let row = 0; row < rows - 1; row++) {
            drawSeg(
              pts[row][col],
              pts[row + 1][col],
              prox[row][col],
              prox[row + 1][col]
            );
          }
        }

        // Intersection nodes & glows
        for (let row = 0; row < rows; row++) {
          for (let col = 0; col < cols; col++) {
            const p = pts[row][col];
            const pr = prox[row][col];
            const t = pr * pr * (3 - 2 * pr);
            const r = lerpN(NODE_BASE_RADIUS, NODE_ACTIVE_RADIUS, t);

            if (t > 0.3) {
              const glowR = r + lerpN(0, 6, (t - 0.3) / 0.7);
              const grd = ctx.createRadialGradient(
                p.x,
                p.y,
                r * 0.5,
                p.x,
                p.y,
                glowR
              );
              grd.addColorStop(
                0,
                `rgba(${activeTheme.glow},${(t * 0.3).toFixed(3)})`
              );
              grd.addColorStop(1, `rgba(${activeTheme.glow},0)`);
              ctx.beginPath();
              ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2);
              ctx.fillStyle = grd;
              ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
            ctx.fillStyle = lerpColor(
              { r: 255, g: 255, b: 255, a: 0.2 },
              activeTheme.nodeActive,
              t
            );
            ctx.fill();
          }
        }

        // Expanding shockwave ripples
        for (let i = 0; i < ripples.length; i++) {
          const rip = ripples[i];
          const safeRadius = Math.max(0, rip.radius);
          ctx.beginPath();
          ctx.arc(rip.x, rip.y, safeRadius, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${activeTheme.ripple},${(
            rip.opacity * 0.28
          ).toFixed(3)})`;
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }
      };

      const loop = (now: number) => {
        mouseRef.current.x = lerpN(
          mouseRef.current.x,
          targetMouseRef.current.x,
          lerpSpeed
        );
        mouseRef.current.y = lerpN(
          mouseRef.current.y,
          targetMouseRef.current.y,
          lerpSpeed
        );
        draw(now);
        animationFrameId = requestAnimationFrame(loop);
      };

      animationFrameId = requestAnimationFrame(loop);

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener("resize", handleResize);
        window.removeEventListener("mousemove", handleMouseMove);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("click", handleClick);
      };
    }, [
      globalColor,
      cellSize,
      influenceRadius,
      maxWarp,
      lerpSpeed,
      showDots,
    ]);

    return (
      <div
        className={cn(
          "relative w-full min-h-screen overflow-x-hidden selection:bg-sky-500/30 selection:text-sky-200",
          globalColor === "monochrome"
            ? "bg-[#000000]"
            : globalColor === "emerald"
            ? "bg-[#0a120e]"
            : globalColor === "violet"
            ? "bg-[#100d1c]"
            : "bg-[#161618]",
          className
        )}
      >
        <canvas
          ref={canvasRef}
          className="fixed inset-0 w-full h-full pointer-events-none z-0"
        />
        <div className="relative z-10 w-full">{children}</div>
      </div>
    );
  }
);

KineticGrid.displayName = "KineticGrid";
export default KineticGrid;
