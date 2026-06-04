"use client";

import { Button } from "@/components/ui/Button";
import { SectionLabel } from "@/components/landing/SectionLabel";
import { SectionTitle } from "@/components/landing/SectionTitle";
import { SectionSub } from "@/components/landing/SectionSub";

export function ProofBlocksSection({ navigate }: { navigate: (href: string) => void }) {
  return (
    <section className="border-t border-[var(--border)] py-24">
      <div className="mx-auto max-w-7xl px-6 md:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <SectionLabel>Early access</SectionLabel>
          <SectionTitle className="text-center">Built for agencies that actually close deals.</SectionTitle>
          <SectionSub className="mx-auto text-center">
            Nearsited is a new tool. We&rsquo;re working with our first 20 design agencies to refine the workflow before scaling. Join the early cohort — pricing is locked at the launch rate.
          </SectionSub>
          <div className="mt-8">
            <Button variant="primary" onClick={() => navigate("/signup")} className="px-8 py-3 text-base">
              Start free →
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
