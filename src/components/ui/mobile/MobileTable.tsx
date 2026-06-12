"use client";

import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

export type MobileTableColumn<T> = {
  key: keyof T | string;
  label: string;
  priority: "primary" | "headline" | "meta" | "action";
  render?: (row: T) => ReactNode;
};

type MobileTableProps<T extends { id: string }> = {
  columns: MobileTableColumn<T>[];
  rows: T[];
  onRowClick?: (row: T) => void;
  className?: string;
};

export function MobileTable<T extends { id: string }>({
  columns,
  rows,
  onRowClick,
  className,
}: MobileTableProps<T>) {
  const primary = columns.find((c) => c.priority === "primary");
  const headline = columns.find((c) => c.priority === "headline");
  const meta = columns.filter((c) => c.priority === "meta");
  const actions = columns.filter((c) => c.priority === "action");

  const getCellValue = (col: MobileTableColumn<T>, row: T): ReactNode => {
    if (col.render) return col.render(row);
    const val = row[col.key as keyof T];
    return val !== undefined && val !== null ? String(val) : null;
  };

  return (
    <div className={cn("divide-y divide-[var(--color-border-subtle)]", className)}>
      {rows.map((row) => (
        <div
          key={row.id}
          className={cn(
            "flex items-center gap-3 px-4 py-3",
            "min-h-[56px]",
            onRowClick
              ? "cursor-pointer transition-colors hover:bg-[var(--color-bg-surface)]"
              : "",
          )}
          onClick={onRowClick ? () => onRowClick(row) : undefined}
          role={onRowClick ? "button" : undefined}
          tabIndex={onRowClick ? 0 : undefined}
          onKeyDown={
            onRowClick
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onRowClick(row);
                  }
                }
              : undefined
          }
        >
          {/* Primary — score/avatar — left */}
          {primary && (
            <div className="shrink-0">{getCellValue(primary, row)}</div>
          )}

          {/* Main content — headline + meta */}
          <div className="min-w-0 flex-1">
            {headline && (
              <p className="truncate text-sm font-medium text-[var(--color-text-primary)]">
                {getCellValue(headline, row)}
              </p>
            )}
            {meta.length > 0 && (
              <p className="mt-0.5 flex flex-wrap gap-x-1.5 text-xs text-[var(--color-text-tertiary)]">
                {meta.map((col, i) => (
                  <span key={String(col.key)}>
                    {i > 0 && <span aria-hidden="true">·</span>}
                    {getCellValue(col, row)}
                  </span>
                ))}
              </p>
            )}
          </div>

          {/* Actions — right */}
          {actions.length > 0 && (
            <div
              className="flex shrink-0 items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {actions.map((col) => (
                <div key={String(col.key)}>{getCellValue(col, row)}</div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
