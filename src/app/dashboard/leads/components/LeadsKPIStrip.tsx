"use client";

import { motion } from "@/lib/motion";
import { useCountUp } from "@/lib/shared-hooks";
import { fadeUpVariants, staggerVariants } from "@/lib/motion";

type KPI = {
  value: number;
  label: string;
  accentClass?: string; // Optional thin left border accent
  onClick?: () => void;
};

function KpiCard({ value, label, accentClass, onClick }: KPI) {
  const { display } = useCountUp(value, 1500);
  return (
    <motion.div
      variants={fadeUpVariants}
      onClick={onClick}
      className={`rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4 transition-all duration-150 ${
        onClick ? "cursor-pointer hover:shadow-[var(--brand-shadow-sm)] hover:border-[var(--accent)]/40" : ""
      } ${accentClass ? `border-l-2 ${accentClass}` : ""}`}
    >
      <p className="text-2xl font-bold text-[var(--text-primary)]">{display}</p>
      <p className="mt-0.5 text-xs text-[var(--text-tertiary)]">{label}</p>
    </motion.div>
  );
}

export function LeadsKPIStrip({ kpis }: { kpis: KPI[] }) {
  return (
    <motion.div
      variants={staggerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {kpis.map((s) => (
        <KpiCard key={s.label} {...s} />
      ))}
    </motion.div>
  );
}
