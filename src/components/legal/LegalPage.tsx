"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";

export type TOCSection = {
  id: string;
  label: string;
};

type Props = {
  title: string;
  lastUpdated: string;
  toc: TOCSection[];
  children: ReactNode;
};

export function LegalPage({ title, lastUpdated, toc, children }: Props) {
  const [activeId, setActiveId] = useState<string>(toc[0]?.id ?? "");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const ids = toc.map((s) => s.id);

    observerRef.current = new IntersectionObserver(
      (entries) => {
        // Pick the topmost section that has crossed the upper threshold
        const passing = entries.filter((e) => e.isIntersecting);
        if (passing.length > 0) {
          // Sort by position on page; take the topmost
          const sorted = passing.sort(
            (a, b) => a.boundingClientRect.top - b.boundingClientRect.top,
          );
          setActiveId(sorted[0].target.id);
        }
      },
      { rootMargin: "-8% 0px -55% 0px", threshold: 0 },
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [toc]);

  return (
    <div className="min-h-screen bg-[var(--color-bg-page)] text-[var(--color-text-primary)]">
      {/* Top bar */}
      <div className="border-b border-[var(--color-border-subtle)]">
        <div className="mx-auto max-w-[1000px] flex items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-sm text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-text-secondary)]"
          >
            ← Nearsited
          </Link>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-[1000px] px-6 py-12 md:py-16">
        <div className="lg:grid lg:grid-cols-[200px_1fr] lg:gap-16">
          {/* Sticky TOC — lg+ only */}
          <aside className="hidden lg:block">
            <div className="sticky top-10 space-y-1">
              <p className="mb-3 text-[10px] font-medium uppercase tracking-[0.08em] text-[var(--color-text-tertiary)]">
                Contents
              </p>
              {toc.map((section) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    document
                      .getElementById(section.id)
                      ?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className={`block py-1 text-[13px] leading-snug transition-colors ${
                    activeId === section.id
                      ? "font-medium text-[var(--color-accent)]"
                      : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                  }`}
                >
                  {section.label}
                </a>
              ))}
            </div>
          </aside>

          {/* Content */}
          <main className="min-w-0 max-w-[720px]">
            <h1 className="text-[1.75rem] font-medium leading-tight tracking-[-0.02em] text-[var(--color-text-primary)]">
              {title}
            </h1>
            <p className="mt-2 text-xs text-[var(--color-text-tertiary)]">
              Last updated: {lastUpdated}
            </p>

            <div className="mt-10 space-y-10 text-sm leading-[1.7] text-[var(--color-text-secondary)]">
              {children}
            </div>

            {/* Contact footer */}
            <div className="mt-12 border-t border-[var(--color-border-subtle)] pt-8">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Questions?{" "}
                <a
                  href="mailto:nearsitedlabs@gmail.com"
                  className="text-[var(--color-accent)] hover:underline"
                >
                  nearsitedlabs@gmail.com
                </a>
              </p>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}

/** Reusable section wrapper that anchors to an id for TOC scrolling */
export function LegalSection({
  id,
  heading,
  children,
}: {
  id: string;
  heading: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2
        id={id}
        className="scroll-mt-6 text-base font-medium text-[var(--color-text-primary)]"
      >
        {heading}
      </h2>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

/** Subsection h3 */
export function LegalSubSection({
  heading,
  children,
}: {
  heading: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-5">
      <h3 className="text-sm font-medium text-[var(--color-text-primary)]">{heading}</h3>
      <div className="mt-2 space-y-2">{children}</div>
    </div>
  );
}
