import { cn } from "@/lib/cn";
import type { StockLevel } from "@/lib/mock-data";

type StockBadgeProps = {
  level: StockLevel;
  stock?: number;
  className?: string;
};

const styles: Record<StockLevel, string> = {
  in: "bg-success-soft text-success",
  low: "bg-tint text-brand",
  out: "border border-line bg-page text-muted",
};

export function StockBadge({ level, stock, className }: StockBadgeProps) {
  const label =
    level === "in"
      ? "В наличии"
      : level === "low"
        ? `Мало${typeof stock === "number" ? ` · ${stock} шт` : ""}`
        : "Нет в наличии";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
        styles[level],
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden="true" />
      {label}
    </span>
  );
}
