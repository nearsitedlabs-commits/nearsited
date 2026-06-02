"use client";

import { useEffect, useRef } from "react";

// ── Constants ──────────────────────────────────────────────────────────────────

const GRID_LINE_COLOR = "rgba(120, 140, 110, 0.12)";
const NODE_RESTING_COLOR = "rgba(100, 120, 90, 0.25)";
const NODE_ACTIVATED_COLOR = [140, 165, 110] as const; // RGB tuple
const NODE_COUNT = 100;
const LENS_RADIUS_BASE = 180;
const LENS_RADIUS_AMP = 60; // ±60px breathing
const LENS_BREATHE_PERIOD = 20; // seconds
const MOUNT_DELAY = 0.3; // seconds before first lens pass starts

// ── Types ──────────────────────────────────────────────────────────────────────

interface SignalNode {
  x: number; // normalized 0–1
  y: number; // normalized 0–1
  baseBrightness: number; // 0–1
  phase: number; // random phase for pulse (radians)
  period: number; // pulse period in seconds (4–8)
  clusterId: number; // -1 for none, 0–4 for cluster group
  lastLensInfluence: number; // tracked for smooth fade in/out
}

interface GridLine {
  pos: number; // normalized position 0–1
  horizontal: boolean; // true = horizontal, false = vertical
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Seeded PRNG for reproducible randomness
function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ── Component ──────────────────────────────────────────────────────────────────

export default function OpportunityAtlas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<SignalNode[]>([]);
  const gridLinesRef = useRef<GridLine[]>([]);
  const lensRef = useRef({
    t: -MOUNT_DELAY, // start time offset — first pass begins after delay
    x: 0.35,
    y: 0.45,
    radius: LENS_RADIUS_BASE,
  });
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const rafRef = useRef(0);
  const startTimeRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // ── Generate grid lines (sparse, irregular) ───────────────────────
    const rngGrid = mulberry32(101);
    const lines: GridLine[] = [];
    let xPos = 0;
    while (xPos < 1) {
      xPos += 0.06 + rngGrid() * 0.08; // 60–140px at typical widths
      if (xPos < 1) lines.push({ pos: xPos, horizontal: false });
    }
    let yPos = 0;
    while (yPos < 1) {
      yPos += 0.06 + rngGrid() * 0.08;
      if (yPos < 1) lines.push({ pos: yPos, horizontal: true });
    }
    gridLinesRef.current = lines;

    // ── Generate signal nodes ──────────────────────────────────────────
    const rngNode = mulberry32(42);
    const nodes: SignalNode[] = [];
    const clusterCount = 5;
    const clusters: Array<{ cx: number; cy: number }> = [];
    for (let c = 0; c < clusterCount; c++) {
      clusters.push({
        cx: 0.1 + rngNode() * 0.8,
        cy: 0.1 + rngNode() * 0.8,
      });
    }

    for (let i = 0; i < NODE_COUNT; i++) {
      const inCluster = rngNode() < 0.15;
      let x: number, y: number, clusterId = -1;
      if (inCluster) {
        clusterId = Math.floor(rngNode() * clusterCount);
        const c = clusters[clusterId];
        const angle = rngNode() * Math.PI * 2;
        const radius = 0.01 + rngNode() * 0.025;
        x = c.cx + Math.cos(angle) * radius;
        y = c.cy + Math.sin(angle) * radius;
      } else {
        x = 0.02 + rngNode() * 0.96;
        y = 0.02 + rngNode() * 0.96;
      }

      nodes.push({
        x,
        y,
        baseBrightness: 0.15 + rngNode() * 0.35,
        phase: rngNode() * Math.PI * 2,
        period: 4 + rngNode() * 4, // 4–8 seconds
        clusterId,
        lastLensInfluence: 0,
      });
    }
    nodesRef.current = nodes;

    // ── Resize handler ─────────────────────────────────────────────────
    function handleResize() {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      sizeRef.current = { w, h, dpr };
      canvas!.width = w * dpr;
      canvas!.height = h * dpr;
      canvas!.style.width = `${w}px`;
      canvas!.style.height = `${h}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    const resizeObserver = new ResizeObserver(() => handleResize());
    resizeObserver.observe(canvas);

    handleResize();

    // ── Animation loop ─────────────────────────────────────────────────
    startTimeRef.current = performance.now();

    function draw(now: number) {
      const elapsed = (now - startTimeRef.current) / 1000; // seconds
      const { w, h } = sizeRef.current;
      if (w === 0 || h === 0) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }

      ctx!.clearRect(0, 0, w, h);

      // ── Update lens ─────────────────────────────────────────────────
      const lensT = Math.max(0, elapsed + MOUNT_DELAY);
      const lens = lensRef.current;
      lens.t = lensT;

      // Lissajous path: slow, organic, non-repeating
      const lx = 0.35 + 0.3 * Math.sin(lensT * 0.18 + 0.5 * Math.sin(lensT * 0.04));
      const ly = 0.35 + 0.3 * Math.sin(lensT * 0.22 + 1.3 * Math.sin(lensT * 0.035));
      lens.x = lx;
      lens.y = ly;

      // Breathing radius
      const breathe = Math.sin(lensT * (Math.PI * 2 / LENS_BREATHE_PERIOD)) * 0.5 + 0.5;
      lens.radius = LENS_RADIUS_BASE + (breathe - 0.5) * LENS_RADIUS_AMP * 2;

      const lpx = lens.x * w;
      const lpy = lens.y * h;
      const lr = lens.radius;

      // ════════════════════════════════════════════════════════════════
      // LAYER 1: Atlas Grid
      // ════════════════════════════════════════════════════════════════
      ctx!.strokeStyle = GRID_LINE_COLOR;
      ctx!.lineWidth = 0.5;

      for (const line of gridLinesRef.current) {
        if (line.horizontal) {
          const y = line.pos * h;
          ctx!.beginPath();
          ctx!.moveTo(0, y);
          ctx!.lineTo(w, y);
          ctx!.stroke();
        } else {
          const x = line.pos * w;
          ctx!.beginPath();
          ctx!.moveTo(x, 0);
          ctx!.lineTo(x, h);
          ctx!.stroke();
        }
      }

      // ── Tick marks at occasional intersections ──────────────────────
      const horizontalLines = gridLinesRef.current.filter((l) => l.horizontal);
      const verticalLines = gridLinesRef.current.filter((l) => !l.horizontal);
      // Only draw ticks at some intersections (not all)
      for (let hi = 0; hi < horizontalLines.length; hi += 3) {
        for (let vi = 0; vi < verticalLines.length; vi += 3) {
          const tx = verticalLines[vi].pos * w;
          const ty = horizontalLines[hi].pos * h;
          const tickSize = 3;
          ctx!.beginPath();
          ctx!.moveTo(tx - tickSize, ty);
          ctx!.lineTo(tx + tickSize, ty);
          ctx!.moveTo(tx, ty - tickSize);
          ctx!.lineTo(tx, ty + tickSize);
          ctx!.stroke();
        }
      }

      // ════════════════════════════════════════════════════════════════
      // LAYER 2: Opportunity Field (signal nodes)
      // ════════════════════════════════════════════════════════════════
      const nodes = nodesRef.current;

      // Pre-compute lens influence for all nodes (for connection drawing)
      const influences = new Float32Array(nodes.length);

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const px = node.x * w;
        const py = node.y * h;
        const dx = px - lpx;
        const dy = py - lpy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Lens influence with smooth radial falloff over outer 40% of radius
        const rawInfluence = dist < lr
          ? smoothstep(lr * 0.6, 0, dist) // 0 at outer edge, 1 at center
          : 0;

        // Smooth fade in/out over time
        const targetInfluence = rawInfluence;
        node.lastLensInfluence = lerp(
          node.lastLensInfluence,
          targetInfluence,
          0.05, // gentle smoothing per frame
        );
        const lensInfluence = node.lastLensInfluence;

        influences[i] = lensInfluence;

        // ── Pulse cycle ──────────────────────────────────────────────
        const pulse = Math.sin(elapsed * (Math.PI * 2 / node.period) + node.phase) * 0.5 + 0.5;

        // ── Determine opacity ─────────────────────────────────────────
        const opacity = lensInfluence > 0.01
          ? lerp(0.3, 0.95, lensInfluence * pulse)
          : 0.15 + node.baseBrightness * 0.2;

        // ── Determine color ───────────────────────────────────────────
        if (lensInfluence > 0.01) {
          // Inside lens: shift toward activated color
          const r = lerp(100, NODE_ACTIVATED_COLOR[0], lensInfluence);
          const g = lerp(120, NODE_ACTIVATED_COLOR[1], lensInfluence);
          const b = lerp(90, NODE_ACTIVATED_COLOR[2], lensInfluence);
          ctx!.fillStyle = `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${opacity})`;
        } else {
          ctx!.fillStyle = `${NODE_RESTING_COLOR}`;
          // Override opacity for resting state
          ctx!.globalAlpha = opacity;
        }

        // ── Radius ────────────────────────────────────────────────────
        const radius = lensInfluence > 0.01
          ? lerp(1.2, 2.5, lensInfluence)
          : 1.0 + node.baseBrightness * 0.8;

        // ── Draw node ─────────────────────────────────────────────────
        ctx!.beginPath();
        ctx!.arc(px, py, radius, 0, Math.PI * 2);
        ctx!.fill();
        ctx!.globalAlpha = 1;

        // ── Draw cluster connections inside lens ──────────────────────
        if (lensInfluence > 0.05 && node.clusterId >= 0) {
          // Find other nodes in same cluster and draw connections
          for (let j = i + 1; j < nodes.length; j++) {
            const other = nodes[j];
            if (other.clusterId !== node.clusterId) continue;
            if (influences[j] < 0.05) continue;

            const ox = other.x * w;
            const oy = other.y * h;
            const cdx = px - ox;
            const cdy = py - oy;
            const cDist = Math.sqrt(cdx * cdx + cdy * cdy);

            if (cDist < 60) {
              const connAlpha = Math.min(influences[i], influences[j]) * 0.25;
              ctx!.strokeStyle = `rgba(120, 150, 100, ${connAlpha})`;
              ctx!.lineWidth = 0.5;
              ctx!.beginPath();
              ctx!.moveTo(px, py);
              ctx!.lineTo(ox, oy);
              ctx!.stroke();
            }
          }
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    }

    rafRef.current = requestAnimationFrame(draw);

    // ── Cleanup ───────────────────────────────────────────────────────
    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ display: "block" }}
    />
  );
}
