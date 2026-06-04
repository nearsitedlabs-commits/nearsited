import { SectionLabel } from "@/components/landing/SectionLabel";

export function FounderStorySection() {
  return (
    <section className="border-t border-[var(--border)] bg-[var(--bg-surface)] py-24">
      <div className="mx-auto max-w-3xl px-6 md:px-8">
        <div className="text-center">
          <SectionLabel>The story</SectionLabel>
        </div>
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
        <div className="mt-8 text-center">
          <p className="text-sm text-[var(--text-tertiary)]">
            Built by <a href="https://againlive.com" className="text-[var(--accent)] hover:underline" target="_blank" rel="noopener noreferrer">Again Labs</a>.
          </p>
        </div>
      </div>
    </section>
  );
}
