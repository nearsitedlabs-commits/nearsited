"use client";

import * as Select from "@radix-ui/react-select";
import { ChevronDown } from "lucide-react";

type Option = {
  value: string;
  label: string;
};

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  className?: string;
};

export default function PipelineSelect({ value, onChange, options, className = "" }: Props) {
  return (
    <Select.Root value={value} onValueChange={onChange}>
      <Select.Trigger
        className={`inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2.5 py-1.5 text-xs font-medium text-center text-[var(--text-secondary)] outline-none transition-colors duration-150 focus:border-[var(--accent)] ${className}`}
      >
        <Select.Value />
        <Select.Icon>
          <ChevronDown className="h-3 w-3 text-[var(--text-tertiary)]" />
        </Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          className="z-50 overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--bg-surface-3)] shadow-[var(--brand-shadow-lg)]"
          position="popper"
          sideOffset={4}
        >
          <Select.Viewport className="p-1">
            {options.map((opt) => (
              <Select.Item
                key={opt.value}
                value={opt.value}
                className="relative flex cursor-pointer select-none items-center justify-center rounded-md px-2.5 py-2 text-xs font-medium text-center text-[var(--text-secondary)] outline-none transition-colors duration-100 data-[highlighted]:bg-[var(--bg-elevated)] data-[highlighted]:text-[var(--text-primary)] data-[state=checked]:text-[var(--accent)]"
              >
                <Select.ItemText>{opt.label}</Select.ItemText>
              </Select.Item>
            ))}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
}
