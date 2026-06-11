"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PIPELINE_LABELS, PIPELINE_SALES_STATUSES } from "@/lib/ui-constants";

interface CardActionsMenuProps {
  pipelineId: string;
  businessId: string;
  onStatusChange: (pipelineId: string, status: string) => void;
  onDelete?: (pipelineId: string) => void;
}

/**
 * Overflow menu with `⋯` button for card-level actions.
 * Includes view opportunity, move-to-stage actions, archive, and delete.
 */
export function CardActionsMenu({
  pipelineId,
  businessId,
  onStatusChange,
  onDelete,
}: CardActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmDelete(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setOpen((prev) => !prev);
    setConfirmDelete(false);
  }, []);

  const handleAction = useCallback(
    (action: () => void) => (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      action();
      setOpen(false);
      setConfirmDelete(false);
    },
    []
  );

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setConfirmDelete(true);
  }, []);

  const handleConfirmDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      onDelete?.(pipelineId);
      setOpen(false);
      setConfirmDelete(false);
    },
    [onDelete, pipelineId]
  );

  const handleCancelDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setConfirmDelete(false);
  }, []);

  return (
    <div ref={menuRef} className="relative shrink-0">
      {/* Trigger button */}
      <button
        onClick={handleToggle}
        className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)] text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]"
        aria-label="Card actions"
        aria-expanded={open}
      >
        ⋯
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 min-w-[200px] rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] bg-[var(--color-bg-surface)] py-1 shadow-lg">
          {!confirmDelete ? (
            <>
              <Link
                href={`/dashboard/leads/${businessId}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setOpen(false);
                }}
                className="block px-3 py-1.5 text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)]"
              >
                View opportunity
              </Link>
              <button
                onClick={handleAction(() => {
                  /* placeholder: open pitch modal */
                })}
                className="block w-full px-3 py-1.5 text-left text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)]"
              >
                View pitch
              </button>
              <button
                onClick={handleAction(() => {
                  /* placeholder: open compose modal */
                })}
                className="block w-full px-3 py-1.5 text-left text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)]"
              >
                Log reply
              </button>

              <hr className="my-1 border-[var(--color-border-subtle)]" />

              {PIPELINE_SALES_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={handleAction(() => onStatusChange(pipelineId, s))}
                  className="block w-full px-3 py-1.5 text-left text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)]"
                >
                  Move to: {PIPELINE_LABELS[s]}
                </button>
              ))}

              <hr className="my-1 border-[var(--color-border-subtle)]" />

              <button
                onClick={handleAction(() => {
                  /* placeholder: archive */
                })}
                className="block w-full px-3 py-1.5 text-left text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-elevated)]"
              >
                Archive
              </button>
              <button
                onClick={handleDeleteClick}
                className="block w-full px-3 py-1.5 text-left text-xs text-red-500 transition-colors hover:bg-red-500/10"
              >
                Delete
              </button>
            </>
          ) : (
            <div className="px-3 py-2">
              <p className="mb-1.5 text-[10px] text-red-500">Delete this opportunity?</p>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleConfirmDelete}
                  className="rounded-[var(--radius-sm)] bg-red-500 px-2 py-0.5 text-[10px] text-white transition-colors hover:bg-red-600"
                >
                  Yes, delete
                </button>
                <button
                  onClick={handleCancelDelete}
                  className="rounded-[var(--radius-sm)] border border-[var(--color-border-subtle)] px-2 py-0.5 text-[10px] text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-bg-elevated)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
