"use client";

import { motion } from "framer-motion";
import { useCountUp } from "@/lib/shared-hooks";
import { fadeUpVariants, staggerVariants } from "@/lib/motion";

type KPI = { value: number; label: string; valueClass: string };

function KpiCard({ value, label, valueClass }: KPI) {
  const { display } = useCountUp(value, 1500);
  return (
    <motion.div
      variants={fadeUpVariants}
      className="rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] p-4"
    >
      <p className={`text-2xl font-bold ${valueClass}`}>{display}</p>
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
