"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { motion, AnimatePresence, useReducedMotion } from "@/lib/motion";

type ToastType = "success" | "error" | "info";

type ToastProps = {
  message: string;
  onClose: () => void;
  duration?: number;
  type?: ToastType;
};

const MOTION_EASE = [0.25, 0.1, 0.25, 1] as const;

const TYPE_STYLES: Record<ToastType, { bg: string; icon: ReactNode }> = {
  success: {
    bg: "bg-[var(--score-good)]",
    icon: (
      <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
        <path d="M2.5 6l2.5 2.5 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  error: {
    bg: "bg-red-500",
    icon: (
      <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
        <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  info: {
    bg: "bg-[var(--color-accent)]",
    icon: (
      <svg className="h-3 w-3 text-white" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M6 5.5v3M6 4v.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
};

export function Toast({ message, onClose, duration = 3000, type = "success" }: ToastProps) {
  const typeStyle = TYPE_STYLES[type];
  const prefersReduced = useReducedMotion();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (prefersReduced) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      setVisible(false);
      // Wait for exit animation (250ms) before unmounting
      setTimeout(onClose, 280);
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration, prefersReduced]);

  // Reduced-motion render: no animation wrappers
  if (prefersReduced) {
    return (
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] px-5 py-3.5 text-sm font-medium text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] shadow-[var(--brand-shadow-lg)]">
        <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${typeStyle.bg}`}>
          {typeStyle.icon}
        </span>
        {message}
      </div>
    );
  }

  return (
    <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50">
      <AnimatePresence>
        {visible && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ duration: 0.25, ease: MOTION_EASE }}
            className="flex items-center gap-3 rounded-[var(--radius-md)] bg-[var(--color-bg-surface)] px-5 py-3.5 text-sm font-medium text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] shadow-[var(--brand-shadow-lg)]"
          >
            <span className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full ${typeStyle.bg}`}>
              {typeStyle.icon}
            </span>
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function useToast() {
  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
  }, []);
  return { toast, showToast, setToast };
}
