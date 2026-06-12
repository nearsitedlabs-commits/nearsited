"use client";

import { useEffect, useRef, useCallback, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/cn";

type BottomSheetProps = {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  className?: string;
};

const BACKDROP_VARIANTS = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

export function BottomSheet({ isOpen, onClose, title, children, className }: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const prefersReduced = useReducedMotion();

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    if (!isOpen) return;

    const sheet = sheetRef.current;
    if (!sheet) return;

    const focusable = sheet.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
    );
    focusable[0]?.focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseRef.current();
        return;
      }
      if (e.key !== "Tab") return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [isOpen]);

  // Lock body scroll while sheet is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleDragStart = useCallback(
    (e: React.PointerEvent) => {
      const startY = e.clientY;
      const sheet = sheetRef.current;
      if (!sheet) return;

      const onMove = (ev: PointerEvent) => {
        const delta = ev.clientY - startY;
        if (delta > 0) sheet.style.transform = `translateY(${delta}px)`;
      };

      const onUp = (ev: PointerEvent) => {
        const delta = ev.clientY - startY;
        sheet.style.transform = "";
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        if (delta > 80) onCloseRef.current();
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [],
  );

  const d = prefersReduced ? 0 : 1;
  // Entrance: deliberate (400ms) emphasized — sheets feel intentional
  // Exit: standard (250ms) ease-out — faster exit feels responsive
  const sheetVariants = {
    hidden: { y: "100%", transition: { duration: 0.25 * d, ease: [0.25, 0.1, 0.25, 1] as [number, number, number, number] } },
    visible: { y: 0, transition: { duration: 0.4 * d, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } },
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            variants={BACKDROP_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.25 * d, ease: [0.25, 0.1, 0.25, 1] }}
            className="fixed inset-0 z-[var(--z-modal)] bg-black/60"
            aria-hidden="true"
            onClick={onClose}
          />

          {/* Sheet */}
          <motion.div
            key="sheet"
            ref={sheetRef}
            role="dialog"
            aria-modal="true"
            aria-label={title ?? "Sheet"}
            variants={sheetVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className={cn(
              "fixed bottom-0 left-0 right-0 z-[calc(var(--z-modal)+1)]",
              "bg-[var(--color-bg-elevated)]",
              "rounded-t-[var(--radius-md)]",
              "pb-[var(--mobile-safe-bottom)]",
              "max-h-[90dvh] overflow-y-auto",
              className,
            )}
          >
            {/* Drag handle */}
            <div
              className="flex cursor-grab items-center justify-center py-3 active:cursor-grabbing"
              onPointerDown={handleDragStart}
              aria-hidden="true"
            >
              <div className="h-1 w-10 rounded-full bg-[var(--color-border-strong)]" />
            </div>

            {title ? (
              <div className="border-b border-[var(--color-border-subtle)] px-5 pb-4">
                <h2 className="text-base font-medium text-[var(--color-text-primary)]">
                  {title}
                </h2>
              </div>
            ) : null}

            <div className="px-5 py-4">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
