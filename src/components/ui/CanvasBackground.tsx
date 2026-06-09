"use client";

import { useEffect, useRef } from "react";

export function CanvasBackground({ fixed = false }: { fixed?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(max-width: 767px)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId: number;
    let time = 0;
    let isVisible = true;

    // Stop animating when off-screen to save CPU
    const observer = new IntersectionObserver(
      ([entry]) => { isVisible = entry.isIntersecting; },
      { threshold: 0 },
    );
    observer.observe(canvas);

    const PARTICLE_COUNT = 36;
    const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
      x: Math.random(),
      y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0006,
      vy: (Math.random() - 0.5) * 0.0006,
      phase: Math.random() * Math.PI * 2,
    }));

    const SCAN_SPEED = 0.004;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }

    resize();
    window.addEventListener("resize", resize);

    function draw() {
      if (!isVisible) { rafId = requestAnimationFrame(draw); return; }
      time++;
      const w = canvas!.width;
      const h = canvas!.height;
      const t = time * 0.01;

      ctx!.clearRect(0, 0, w, h);

      // Radial accent glow
      const gx = w * 0.35 + Math.sin(t * 0.012) * w * 0.1;
      const gy = h * 0.3 + Math.cos(t * 0.009) * h * 0.08;
      const glow = ctx!.createRadialGradient(gx, gy, 0, gx, gy, w * 0.35);
      glow.addColorStop(0, "rgba(138,151,119,0.035)");
      glow.addColorStop(0.5, "rgba(138,151,119,0.015)");
      glow.addColorStop(1, "transparent");
      ctx!.fillStyle = glow;
      ctx!.fillRect(0, 0, w, h);

      // Secondary violet glow
      const vx = w * 0.7 + Math.sin(t * 0.015 + 1) * w * 0.08;
      const vy = h * 0.6 + Math.cos(t * 0.011 + 1) * h * 0.06;
      const vGlow = ctx!.createRadialGradient(vx, vy, 0, vx, vy, w * 0.25);
      vGlow.addColorStop(0, "rgba(120,110,200,0.025)");
      vGlow.addColorStop(1, "transparent");
      ctx!.fillStyle = vGlow;
      ctx!.fillRect(0, 0, w, h);

      // Particles
      for (const p of particles) {
        p.x += p.vx + Math.sin(time * 0.003 + p.phase) * 0.0003;
        p.y += p.vy + Math.cos(time * 0.004 + p.phase) * 0.0003;
        if (p.x < 0) p.x = 1;
        if (p.x > 1) p.x = 0;
        if (p.y < 0) p.y = 1;
        if (p.y > 1) p.y = 0;

        const alpha = 0.08 + Math.sin(time * 0.015 + p.phase) * 0.04;
        ctx!.fillStyle = `rgba(138,151,119,${alpha})`;
        ctx!.beginPath();
        ctx!.arc(p.x * w, p.y * h, 1.2, 0, Math.PI * 2);
        ctx!.fill();
      }

      // Particle connections
      ctx!.strokeStyle = "rgba(138,151,119,0.02)";
      ctx!.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = (particles[i].x - particles[j].x) * w;
          const dy = (particles[i].y - particles[j].y) * h;
          if (Math.sqrt(dx * dx + dy * dy) < 90) {
            ctx!.beginPath();
            ctx!.moveTo(particles[i].x * w, particles[i].y * h);
            ctx!.lineTo(particles[j].x * w, particles[j].y * h);
            ctx!.stroke();
          }
        }
      }

      // Scan line
      const scanY = ((time * SCAN_SPEED) % 1) * h;
      const scanGrad = ctx!.createLinearGradient(0, scanY - 40, 0, scanY + 10);
      scanGrad.addColorStop(0, "transparent");
      scanGrad.addColorStop(0.5, "rgba(138,151,119,0.02)");
      scanGrad.addColorStop(1, "transparent");
      ctx!.fillStyle = scanGrad;
      ctx!.fillRect(0, scanY - 40, w, 50);

      rafId = requestAnimationFrame(draw);
    }

    rafId = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      observer.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none z-0 ${fixed ? "fixed" : "absolute"} inset-0 hidden md:block`}
    />
  );
}
