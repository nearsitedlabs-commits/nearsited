"use client";

import { useEffect, useRef } from "react";

export default function LandingBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;
    let lastFrame = 0;
    const TARGET_FPS = 30;
    const FRAME_MS = 1000 / TARGET_FPS;

    let time = 0;
    let mouseX = 0.5;
    let mouseY = 0.5;
    let smoothMX = 0.5;
    let smoothMY = 0.5;

    const NODE_COUNT = 80;
    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      brightness: 0.15 + Math.random() * 0.6,
      phase: Math.random() * Math.PI * 2,
      speed: 0.25 + Math.random() * 0.6,
      size: 1.5 + Math.random() * 2.5,
      cluster: Math.random() < 0.25 ? Math.floor(Math.random() * 5) : -1,
    }));

    const clusterCenters = Array.from({ length: 5 }, () => ({
      x: 0.15 + Math.random() * 0.7,
      y: 0.15 + Math.random() * 0.7,
    }));

    for (const node of nodes) {
      if (node.cluster >= 0) {
        const c = clusterCenters[node.cluster];
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.03 + Math.random() * 0.05;
        node.x = c.x + Math.cos(angle) * radius;
        node.y = c.y + Math.sin(angle) * radius;
      }
    }

    function onMouse(e: MouseEvent) {
      mouseX = e.clientX / window.innerWidth;
      mouseY = e.clientY / window.innerHeight;
    }
    function onTouch(e: TouchEvent) {
      if (e.touches[0]) {
        mouseX = e.touches[0].clientX / window.innerWidth;
        mouseY = e.touches[0].clientY / window.innerHeight;
      }
    }
    window.addEventListener("mousemove", onMouse, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function draw(now: number) {
      rafId = requestAnimationFrame(draw);

      // throttle to TARGET_FPS
      if (now - lastFrame < FRAME_MS) return;
      lastFrame = now;
      time++;

      const w = canvas!.width;
      const h = canvas!.height;
      const t = time * 0.01;

      smoothMX += (mouseX - smoothMX) * 0.03;
      smoothMY += (mouseY - smoothMY) * 0.03;

      ctx!.clearRect(0, 0, w, h);

      // 1. Base fill
      ctx!.fillStyle = "#0B0F18";
      ctx!.fillRect(0, 0, w, h);

      // 2. Ambient glow — single radial gradient per frame
      const gx = smoothMX * w;
      const gy = smoothMY * h;
      const glow = ctx!.createRadialGradient(gx, gy, 0, gx, gy, w * 0.5);
      glow.addColorStop(0, "rgba(79,70,229,0.07)");
      glow.addColorStop(0.4, "rgba(79,70,229,0.03)");
      glow.addColorStop(1, "transparent");
      ctx!.fillStyle = glow;
      ctx!.fillRect(0, 0, w, h);

      // 3. Grid
      ctx!.strokeStyle = "rgba(79,70,229,0.06)";
      ctx!.lineWidth = 0.5;
      const spacing = 40;
      for (let x = spacing; x < w; x += spacing) {
        ctx!.beginPath(); ctx!.moveTo(x, 0); ctx!.lineTo(x, h); ctx!.stroke();
      }
      for (let y = spacing; y < h; y += spacing) {
        ctx!.beginPath(); ctx!.moveTo(0, y); ctx!.lineTo(w, y); ctx!.stroke();
      }

      // 4. Nodes — no sort, no per-node gradient
      const lmx = smoothMX * w;
      const lmy = smoothMY * h;
      const LENS_R = 150;

      for (const node of nodes) {
        const px = node.x * w;
        const py = node.y * h;
        const pulse = Math.sin(t * node.speed + node.phase) * 0.5 + 0.5;
        const dx = px - lmx;
        const dy = py - lmy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const lensFactor = Math.max(0, 1 - dist / LENS_R);

        const finalAlpha = Math.min(0.75, 0.08 + node.brightness * 0.25 + pulse * 0.2 + lensFactor * 0.4);
        if (finalAlpha < 0.02) continue;

        const finalSize = node.size * (0.8 + lensFactor * 0.6);

        ctx!.fillStyle = `rgba(138,151,119,${finalAlpha})`;
        ctx!.beginPath();
        ctx!.arc(px, py, finalSize, 0, Math.PI * 2);
        ctx!.fill();
      }

      // 5. Connections — only within lens, skip if both nodes far
      const CONN_R_SQ = 60 * 60;
      const LENS_SQ = LENS_R * LENS_R;
      ctx!.lineWidth = 0.5;
      for (let i = 0; i < nodes.length; i++) {
        const ax = nodes[i].x * w;
        const ay = nodes[i].y * h;
        const adx = ax - lmx;
        const ady = ay - lmy;
        if (adx * adx + ady * ady > LENS_SQ) continue;

        for (let j = i + 1; j < nodes.length; j++) {
          const bx = nodes[j].x * w;
          const by = nodes[j].y * h;
          const bdx = bx - lmx;
          const bdy = by - lmy;
          if (bdx * bdx + bdy * bdy > LENS_SQ) continue;

          const ex = ax - bx;
          const ey = ay - by;
          const dist2 = ex * ex + ey * ey;
          if (dist2 < CONN_R_SQ) {
            const edgeAlpha = 0.08 * (1 - Math.sqrt(dist2) / 60);
            ctx!.strokeStyle = `rgba(79,70,229,${edgeAlpha})`;
            ctx!.beginPath();
            ctx!.moveTo(ax, ay);
            ctx!.lineTo(bx, by);
            ctx!.stroke();
          }
        }
      }

      // 6. Scan line
      const scanY = ((time * 0.5) % h);
      const scanGrad = ctx!.createLinearGradient(0, scanY - 40, 0, scanY + 10);
      scanGrad.addColorStop(0, "transparent");
      scanGrad.addColorStop(0.5, "rgba(79,70,229,0.025)");
      scanGrad.addColorStop(1, "transparent");
      ctx!.fillStyle = scanGrad;
      ctx!.fillRect(0, scanY - 40, w, 50);
    }

    rafId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMouse);
      window.removeEventListener("touchmove", onTouch);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ width: "100%", height: "100%" }}
    />
  );
}
