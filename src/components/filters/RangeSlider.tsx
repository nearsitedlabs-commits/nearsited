"use client";

interface RangeSliderProps {
  label: string;
  min?: number;
  max?: number;
  step?: number;
  value: [number, number];
  onChange: (v: [number, number]) => void;
  unit?: string;
}

export function RangeSlider({ label, min = 0, max = 100, step = 5, value, onChange, unit = "" }: RangeSliderProps) {
  const [lo, hi] = value;

  const loPercent = ((lo - min) / (max - min)) * 100;
  const hiPercent = ((hi - min) / (max - min)) * 100;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-secondary)]">{label}</span>
        <span className="text-xs font-medium text-[var(--text-primary)]">
          {lo}{unit} — {hi}{unit}
        </span>
      </div>

      {/* Track */}
      <div className="relative mx-1 h-5 flex items-center">
        <div className="absolute left-0 right-0 h-1 rounded-full bg-[var(--bg-elevated)]" />
        <div
          className="absolute h-1 rounded-full bg-[var(--accent)]"
          style={{ left: `${loPercent}%`, right: `${100 - hiPercent}%` }}
        />
        {/* Min thumb (visual) */}
        <div
          className="pointer-events-none absolute z-10 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-[var(--accent)] bg-[var(--bg-surface)]"
          style={{ left: `${loPercent}%` }}
        />
        {/* Max thumb (visual) */}
        <div
          className="pointer-events-none absolute z-10 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-2 border-[var(--accent)] bg-[var(--bg-surface)]"
          style={{ left: `${hiPercent}%` }}
        />
        {/* Min range input (invisible, handles interaction) */}
        <input
          type="range"
          min={min} max={max} step={step}
          value={lo}
          onChange={e => {
            const v = Number(e.target.value);
            onChange([Math.min(v, hi - step), hi]);
          }}
          className="absolute inset-0 w-full cursor-pointer opacity-0"
          style={{ zIndex: lo >= hi - step * 2 ? 5 : 3 }}
        />
        {/* Max range input (invisible, handles interaction) */}
        <input
          type="range"
          min={min} max={max} step={step}
          value={hi}
          onChange={e => {
            const v = Number(e.target.value);
            onChange([lo, Math.max(v, lo + step)]);
          }}
          className="absolute inset-0 w-full cursor-pointer opacity-0"
          style={{ zIndex: 4 }}
        />
      </div>

      <div className="mt-0.5 flex justify-between text-[10px] text-[var(--text-tertiary)]">
        <span>{min}{unit}</span>
        <span>{max}{unit}</span>
      </div>
    </div>
  );
}
