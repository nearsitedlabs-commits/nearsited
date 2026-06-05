"use client";

import { SectionLabel } from "@/components/landing/SectionLabel";
import { StaggerContainer, FadeUp } from "@/lib/motion";
import { useReducedMotion } from "framer-motion";

export function FounderStorySection() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <section className="border-t border-[var(--border)] bg-[var(--bg-surface)] py-24">
      <div className="mx-auto max-w-3xl px-6 md:px-8">
        <div className="text-center">
          <SectionLabel>The story</SectionLabel>
        </div>
        {prefersReducedMotion ? (
          <div className="mt-8 space-y-5 text-base leading-8 text-[var(--text-secondary)]">
            <p>
              I run a web design agency. Finding clients who actually need a new website was always the hardest part.
            </p>
            <p>
              I&rsquo;d spend hours browsing Google Maps, opening every business website, trying to figure out which ones were outdated. Most were fine. Some were terrible. A few had no website at all. But finding them was manual, slow, and I was always guessing.
            </p>
            <p>
              So I built a tool that does it for me. Enter a city and business type. It finds the businesses with no website, social-only presence, or weak websites — ranks them by opportunity, audits the site, and writes the pitch.
            </p>
            <p>
              It worked for my agency. So I turned it into a product.
            </p>
          </div>
        ) : (
          <StaggerContainer className="mt-8 space-y-5 text-base leading-8 text-[var(--text-secondary)]">
            <FadeUp>
              <p>
                I run a web design agency. Finding clients who actually need a new website was always the hardest part.
              </p>
            </FadeUp>
            <FadeUp>
              <p>
                I&rsquo;d spend hours browsing Google Maps, opening every business website, trying to figure out which ones were outdated. Most were fine. Some were terrible. A few had no website at all. But finding them was manual, slow, and I was always guessing.
              </p>
            </FadeUp>
            <FadeUp>
              <p>
                So I built a tool that does it for me. Enter a city and business type. It finds the businesses with no website, social-only presence, or weak websites — ranks them by opportunity, audits the site, and writes the pitch.
              </p>
            </FadeUp>
            <FadeUp>
              <p>
                It worked for my agency. So I turned it into a product.
              </p>
            </FadeUp>
          </StaggerContainer>
        )}
        <div className="mt-10 text-center">
          <div className="mx-auto flex items-center justify-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--accent)]/10 text-sm font-semibold text-[var(--accent)]">
              AS
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-[var(--text-primary)]">Adin Sheik</p>
              <p className="text-xs text-[var(--text-tertiary)]">Founder, Again Labs</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-[var(--text-tertiary)]">
            Built by <a href="https://againlive.com" className="text-[var(--accent)] hover:underline" title="A web development studio specializing in AI-powered tools" target="_blank" rel="noopener noreferrer">Again Labs</a> — the product studio where Adin built this.
          </p>
        </div>
      </div>
    </section>
  );
}
