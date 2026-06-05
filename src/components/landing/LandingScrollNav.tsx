"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Home, Search, Zap, FileText, MessageSquare, Users, CreditCard } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

const NAV_SECTIONS = [
  { id: "hero",     label: "Overview",      Icon: Home },
  { id: "how",      label: "How it works",  Icon: Search },
  { id: "why",      label: "Why Nearsited", Icon: Zap },
  { id: "report",   label: "Sample report", Icon: FileText },
  { id: "pitch",    label: "Sample pitch",  Icon: MessageSquare },
  { id: "usecases", label: "Use cases",     Icon: Users },
  { id: "pricing",  label: "Pricing",       Icon: CreditCard },
] as const;

const IDS = NAV_SECTIONS.map((s) => s.id);

function useScrollSpy(): string {
  const [activeId, setActiveId] = useState<string>("hero");

  useEffect(() => {
    const elements = IDS
      .map((id) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      { rootMargin: "-10% 0px -55% 0px" },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return activeId;
}

function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);

  const update = useCallback(() => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    setProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", update, { passive: true });
    update();
    return () => window.removeEventListener("scroll", update);
  }, [update]);

  return progress;
}

function MobileProgressBar({ progress, prefersReducedMotion }: { progress: number; prefersReducedMotion: boolean | null }) {
  const barHeight = `${progress * 100}%`;
  return (
    <div
      aria-hidden="true"
      className="fixed right-0 top-0 z-40 flex h-screen w-[3px] flex-col lg:hidden"
      style={{ background: "rgba(255,255,255,0.04)" }}
    >
      {prefersReducedMotion ? (
        <div className="w-full rounded-b-full" style={{ height: barHeight, background: "var(--accent)", opacity: 0.7 }} />
      ) : (
        <motion.div
          className="w-full rounded-b-full"
          style={{ background: "var(--accent)", opacity: 0.7 }}
          animate={{ height: barHeight }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
      )}
    </div>
  );
}

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

type Section = (typeof NAV_SECTIONS)[number];

function NavDot({ section, isActive }: { section: Section; isActive: boolean }) {
  const { Icon } = section;
  return (
    <Tooltip content={section.label} side="left" delayDuration={150}>
      <motion.button
        aria-label={section.label}
        onClick={() => scrollToSection(section.id)}
        className="group flex h-8 w-8 items-center justify-center"
        whileTap={{ scale: 0.9 }}
      >
        <motion.span
          className="flex items-center justify-center rounded-full"
          animate={{
            width: isActive ? 32 : 28,
            height: isActive ? 32 : 28,
            backgroundColor: isActive
              ? "rgba(138,151,119,0.18)"
              : "rgba(255,255,255,0.04)",
            borderColor: isActive
              ? "rgba(138,151,119,0.5)"
              : "rgba(255,255,255,0.08)",
          }}
          whileHover={{
            width: 32,
            height: 32,
            backgroundColor: "rgba(255,255,255,0.08)",
            borderColor: "rgba(255,255,255,0.18)",
          }}
          transition={{ duration: 0.18, ease: [0.25, 0.1, 0.25, 1] }}
          style={{ border: "1px solid" }}
        >
          <Icon
            style={{
              width: 13,
              height: 13,
              color: isActive ? "var(--accent)" : "rgba(255,255,255,0.35)",
              transition: "color 0.18s ease",
            }}
          />
        </motion.span>
      </motion.button>
    </Tooltip>
  );
}

export function LandingScrollNav() {
  const activeId = useScrollSpy();
  const progress = useScrollProgress();
  const prefersReducedMotion = useReducedMotion();

  const inner = (
    <div className="flex flex-col items-center gap-1 rounded-2xl border border-[rgba(255,255,255,0.06)] bg-[rgba(10,14,18,0.7)] px-1 py-2 shadow-[var(--brand-shadow-lg)] backdrop-blur-md">
      {NAV_SECTIONS.map((section) => (
        <NavDot key={section.id} section={section} isActive={activeId === section.id} />
      ))}
    </div>
  );

  return (
    <>
      <MobileProgressBar progress={progress} prefersReducedMotion={prefersReducedMotion} />
      <nav
        aria-label="Page sections"
        className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 lg:flex"
      >
        {prefersReducedMotion ? (
          inner
        ) : (
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
          >
            {inner}
          </motion.div>
        )}
      </nav>
    </>
  );
}
