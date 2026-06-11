"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "@/lib/motion";

type SaveSearchDialogProps = {
  onSave: (name: string) => void;
  onCancel: () => void;
};

export function SaveSearchDialog({
  onSave,
  onCancel,
}: SaveSearchDialogProps) {
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const shouldReduce = useReducedMotion();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  if (shouldReduce) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/25 backdrop-blur-sm"
        onClick={onCancel}
      >
        <div
          className="w-full max-w-sm rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-6 shadow-[var(--brand-shadow-lg)]"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
            Save Search
          </h3>
          <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
            Give this search a name so you can find it later.
          </p>
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Dubai restaurants"
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition-all placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--accent-tint)]"
              autoComplete="off"
            />
            <p className="text-xs text-[var(--color-text-tertiary)]">
              Saved searches appear in the search bar above.
            </p>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={onCancel}
                className="cursor-pointer rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim()}
                className="cursor-pointer rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save Search
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15, ease: "easeOut" }}
    >
      {/* Overlay */}
      <motion.div
        className="absolute inset-0 bg-black/25 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        onClick={onCancel}
      />
      {/* Dialog */}
      <motion.div
        className="relative w-full max-w-sm rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] p-6 shadow-[var(--brand-shadow-lg)]"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
          Save Search
        </h3>
        <p className="mt-1 text-xs text-[var(--color-text-tertiary)]">
          Give this search a name so you can find it later.
        </p>
        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Dubai restaurants"
            className="w-full rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-elevated)] px-3.5 py-2.5 text-sm text-[var(--color-text-primary)] outline-none transition-all placeholder:text-[var(--color-text-tertiary)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--accent-tint)]"
            autoComplete="off"
          />
          <p className="text-xs text-[var(--color-text-tertiary)]">
            Saved searches appear in the search bar above.
          </p>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="cursor-pointer rounded-[var(--radius-md)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="cursor-pointer rounded-[var(--radius-md)] bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save Search
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
