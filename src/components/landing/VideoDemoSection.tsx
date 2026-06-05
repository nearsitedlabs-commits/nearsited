"use client";

import { Play } from "lucide-react";
import { useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/landing/SectionLabel";
import { SectionTitle } from "@/components/landing/SectionTitle";
import { SectionSub } from "@/components/landing/SectionSub";
import { FadeUp } from "@/lib/motion";

export function VideoDemoSection({ navigate }: { navigate: (href: string) => void }) {
  const prefersReducedMotion = useReducedMotion();

  const content = (
    <>
      {/* Section header */}
      <div className="mx-auto max-w-2xl text-center">
        <SectionLabel>See it in action</SectionLabel>
        <SectionTitle className="text-center">
          From search to pitch in under 2 minutes.
        </SectionTitle>
        <SectionSub className="mx-auto text-center">
          Watch how Nearsited finds local businesses without a website, runs a
          full audit, and generates a ready-to-send pitch — all in one workflow.
        </SectionSub>
      </div>

      {/* Mock video player */}
      <div className="relative mx-auto mt-12 max-w-4xl overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-xl">
        {/* Gradient background placeholder */}
        <div className="relative aspect-video w-full bg-gradient-to-br from-[var(--accent)]/20 via-[var(--bg-surface)] to-[var(--accent)]/10">
          {/* Subtle pattern overlay */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "radial-gradient(circle at 1px 1px, var(--accent) 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          />

          {/* Center play button */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg transition-transform hover:scale-105">
              <Play className="h-6 w-6 fill-white pl-0.5" />
            </div>
          </div>

          {/* Bottom overlay text */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6 pt-12">
            <p className="text-lg font-medium text-white">
              Watch how Nearsited finds and audits a local business in under 2
              minutes
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-10 text-center">
        <Button
          variant="primary"
          onClick={() => navigate("/signup")}
          className="px-8 py-3 text-base"
        >
          Try it yourself →
        </Button>
      </div>
    </>
  );

  return (
    <section className="border-t border-[var(--border)] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        {prefersReducedMotion ? content : <FadeUp>{content}</FadeUp>}
      </div>
    </section>
  );
}
