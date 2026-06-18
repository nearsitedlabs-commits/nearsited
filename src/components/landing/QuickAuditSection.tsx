"use client";

import { useState } from "react";
import { Search, Loader2, AlertTriangle, CheckCircle, ArrowRight } from "lucide-react";
import { motion, useSafeReducedMotion, type Variants } from "@/lib/motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

const ease = [0.25, 0.1, 0.25, 1] as const;
const viewport = { once: true, margin: "-40px" as const };

type AuditResult = {
  success: boolean;
  score?: number;
  scoreLabel?: string;
  issues?: { title: string; detail: string }[];
  totalIssuesFound?: number;
  error?: string;
};

export function QuickAuditSection({ navigate }: { navigate: (href: string) => void }) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AuditResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const shouldReduce = useSafeReducedMotion();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/quick-audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          setError("Free scan limit reached (3 per week). Sign up for unlimited audits.");
        } else {
          setError(data.error ?? "Could not audit this site. Try a different URL.");
        }
        return;
      }

      if (!data.success) {
        setError(data.error ?? "Could not audit this site.");
        return;
      }

      setResult(data as AuditResult);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const scoreColor =
    result?.score != null
      ? result.score >= 85
        ? "text-green-400"
        : result.score >= 70
          ? "text-amber-400"
          : "text-red-400"
      : "";

  return (
    <section className="border-t border-[var(--color-border-subtle)] py-14 md:py-20">
      <div className="mx-auto max-w-3xl px-6 md:px-8">
        <motion.div
          className="text-center"
          initial={shouldReduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.35, ease }}
        >
          <div className="mb-4 inline-flex items-center gap-3 text-[0.7rem] uppercase tracking-[0.18em] text-[var(--accent)]">
            <span className="block h-px w-6 bg-[var(--accent)]" />
            Quick Audit
          </div>
          <h2 className="text-[clamp(1.8rem,3vw,2.8rem)] font-medium leading-[1.15] tracking-[-0.02em] text-[var(--text-primary)]">
            See what Nearsited finds.
          </h2>
          <p className="mx-auto mt-4 max-w-lg text-base leading-7 text-[var(--text-secondary)]">
            Paste any website URL. Get a free performance scan — no signup needed.
          </p>
        </motion.div>

        {/* URL Input */}
        <motion.form
          onSubmit={handleSubmit}
          className="mt-8 flex gap-3"
          initial={shouldReduce ? false : { opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={viewport}
          transition={{ duration: 0.35, ease, delay: 0.1 }}
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter a website URL (e.g. example.com)"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-4 py-3 pl-10 text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none transition-colors focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/30"
              disabled={loading}
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          </div>
          <Button
            type="submit"
            variant="primary"
            disabled={loading || !url.trim()}
            className="shrink-0 px-6"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Scan"}
          </Button>
        </motion.form>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 flex items-start gap-3 rounded-[var(--radius-md)] border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400"
          >
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}

        {/* Results */}
        {result && result.success && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease }}
            className="mt-8"
          >
            <Card variant="default" padding="lg" className="overflow-hidden">
              {/* Score */}
              <div className="flex items-center gap-4">
                <div className={`text-4xl font-bold tracking-tight ${scoreColor}`}>
                  {result.score}
                  <span className="text-lg font-normal text-[var(--text-tertiary)]">/100</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {result.scoreLabel}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {result.totalIssuesFound} issue{result.totalIssuesFound !== 1 ? "s" : ""} detected
                  </p>
                </div>
              </div>

              {/* Top issues */}
              {result.issues && result.issues.length > 0 && (
                <div className="mt-6 space-y-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                    Top issues found
                  </p>
                  {result.issues.map((issue, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" />
                      <span>{issue.title}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Gate */}
              <div className="mt-6 rounded-[var(--radius-md)] border border-[var(--color-accent)]/20 bg-[var(--color-accent)]/5 p-4 text-center">
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Want the full picture?
                </p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                  Sign up for free to see revenue estimates, pitch angles, competitor comparison, and the complete 14-signal audit.
                </p>
                <div className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
                  <Button
                    variant="primary"
                    onClick={() => navigate("/signup")}
                    className="w-full sm:w-auto"
                  >
                    Get full audit free <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => navigate("/login")}
                    className="w-full sm:w-auto"
                  >
                    I have an account
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    </section>
  );
}
