"use client";

import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";

type QuantityStepperProps = {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  className?: string;
  label?: string;
};

export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  className,
  label = "Количество",
}: QuantityStepperProps) {
  return (
    <div
      className={cn(
        "inline-flex h-11 items-center rounded-control border border-line-strong bg-surface",
        className,
      )}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Уменьшить количество"
        className="flex size-11 items-center justify-center text-muted transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-40"
      >
        <Icon name="minus" className="size-4" strokeWidth={2} />
      </button>
      <span
        aria-live="polite"
        className="w-8 text-center text-sm font-semibold text-ink"
      >
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Увеличить количество"
        className="flex size-11 items-center justify-center text-muted transition-colors hover:text-ink disabled:pointer-events-none disabled:opacity-40"
      >
        <Icon name="plus" className="size-4" strokeWidth={2} />
      </button>
    </div>
  );
}
