"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Animated counter that eases from 0 to the target value.
 * Once the hook has fired once (SPA navigation) it snaps to value on subsequent renders.
 * Returns `{ display, done }` where `done` is true when the animation completes.
 */
export function useCountUp(value: number, duration = 600): { display: number; done: boolean } {
  const [display, setDisplay] = useState(0);
  const [done, setDone] = useState(false);
  const hasRun = useRef(false);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    if (hasRun.current) {
      setDisplay(value);
      setDone(true);
      return;
    }
    hasRun.current = true;
    setDone(false);
    const start = performance.now();
    const from = 0;
    const diff = value - from;
    function tick(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + diff * eased));
      if (progress >= 1) setDone(true);
      else rafId.current = requestAnimationFrame(tick);
    }
    rafId.current = requestAnimationFrame(tick);

    return () => {
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    };
  }, [value, duration]);

  return { display, done };
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
