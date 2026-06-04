"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Animated counter that eases from 0 to the target value.
 * Once the hook has fired once (SPA navigation) it snaps to value on subsequent renders.
 */
export function useCountUp(value: number, duration = 600): number {
  const [display, setDisplay] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) {
      setDisplay(value);
      return;
    }
    hasRun.current = true;
    const start = performance.now();
    const raf = requestAnimationFrame(function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      setDisplay(Math.round(eased * value));
      if (progress < 1) requestAnimationFrame(tick);
    });
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);

  return display;
}

/**
 * Single-open accordion hook — one item expanded at a time.
 * Returns the currently open index (or null) and a toggle callback.
 */
export function useAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const toggle = useCallback((index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  }, []);
  return { openIndex, toggle, setOpenIndex };
}

/**
 * Simple toast state with auto-dismiss after `duration` ms.
 */
export function useToast(duration = 3000) {
  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback(
    (msg: string) => {
      setToast(msg);
      setTimeout(() => setToast(null), duration);
    },
    [duration],
  );
  return { toast, showToast, setToast };
}
