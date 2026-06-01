"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Command } from "cmdk";
import { cn } from "@/lib/cn";

// ── Types ─────────────────────────────────────────────────────────────────────

type Option = {
  [key: string]: string;
};

type SearchableSelectProps = {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  displayKey: string;
  valueKey: string;
  groupKey?: string;
  inputClassName?: string;
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder,
  displayKey,
  valueKey,
  groupKey,
  inputClassName,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find((opt) => opt[valueKey] === value);
  const displayText = selectedOption ? selectedOption[displayKey] : "";

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = useCallback(
    (selectedValue: string) => {
      onChange(selectedValue);
      setOpen(false);
      setSearch("");
      inputRef.current?.blur();
    },
    [onChange],
  );

  const handleClear = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
    setSearch("");
    setOpen(true);
    inputRef.current?.focus();
  }, [onChange]);

  // Group options by groupKey
  const grouped = groupKey
    ? options.reduce<Record<string, Option[]>>((acc, opt) => {
        const group = opt[groupKey] ?? "Other";
        if (!acc[group]) acc[group] = [];
        acc[group].push(opt);
        return acc;
      }, {})
    : null;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={open ? search : displayText}
          onChange={(e) => {
            setSearch(e.target.value);
            if (!open) setOpen(true);
            if (e.target.value !== displayText) {
              onChange("");
            }
          }}
          onFocus={() => {
            setOpen(true);
            setSearch("");
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setOpen(false);
              setSearch("");
            }
            if ((e.key === "ArrowDown" || e.key === "Enter") && !open) {
              setOpen(true);
              setSearch("");
              e.preventDefault();
            }
          }}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3 pr-10 text-sm text-[var(--text-primary)] outline-none transition-colors duration-150 placeholder:text-[var(--text-tertiary)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-tint)]",
            inputClassName,
          )}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
        />

        {/* Clear or chevron */}
        {(value || search) ? (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] transition-colors duration-150 hover:text-[var(--text-secondary)]"
            tabIndex={-1}
            aria-label="Clear selection"
          >
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        ) : (
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
            <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        )}
      </div>

      {/* Dropdown using cmdk */}
      {open && (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--brand-shadow-lg)]">
          <Command
            label={placeholder}
            shouldFilter={false}
          >
            <Command.List className="max-h-60 overflow-auto p-1">
              {grouped ? (
                Object.entries(grouped).map(([group, groupOptions]) => (
                  <Command.Group
                    key={group}
                    heading={
                      <span className="px-3 py-1.5 text-xs font-medium text-[var(--text-tertiary)]">
                        {group}
                      </span>
                    }
                  >
                    {groupOptions.map((opt) => {
                      const optValue = opt[valueKey];
                      const optDisplay = opt[displayKey];
                      const isSelected = optValue === value;
                      // Filter by search
                      if (
                        search &&
                        !optDisplay.toLowerCase().includes(search.toLowerCase())
                      ) {
                        return null;
                      }
                      return (
                        <Command.Item
                          key={optValue}
                          value={optValue}
                          onSelect={handleSelect}
                          className={cn(
                            "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors duration-100",
                            "aria-selected:bg-[var(--bg-elevated)]",
                            isSelected
                              ? "text-[var(--accent)] font-medium"
                              : "text-[var(--text-secondary)]",
                          )}
                        >
                          {optDisplay}
                        </Command.Item>
                      );
                    })}
                  </Command.Group>
                ))
              ) : (
                <>
                  {options.map((opt) => {
                    const optValue = opt[valueKey];
                    const optDisplay = opt[displayKey];
                    const isSelected = optValue === value;
                    // Filter by search
                    if (
                      search &&
                      !optDisplay.toLowerCase().includes(search.toLowerCase())
                    ) {
                      return null;
                    }
                    return (
                      <Command.Item
                        key={optValue}
                        value={optValue}
                        onSelect={handleSelect}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2.5 text-sm outline-none transition-colors duration-100",
                          "aria-selected:bg-[var(--bg-elevated)]",
                          isSelected
                            ? "text-[var(--accent)] font-medium"
                            : "text-[var(--text-secondary)]",
                        )}
                      >
                        {optDisplay}
                      </Command.Item>
                    );
                  })}
                </>
              )}

              {/* Empty state */}
              <Command.Empty className="px-3 py-4 text-center text-sm text-[var(--text-tertiary)]">
                No results found
              </Command.Empty>
            </Command.List>
          </Command>
        </div>
      )}
    </div>
  );
}
