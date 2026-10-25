import { cn } from "@/lib/cn";
import { orderStatusLabels } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

type StatusBadgeProps = {
  status: OrderStatus;
  className?: string;
};

const styles: Record<OrderStatus, string> = {
  new: "bg-brand-50 text-brand",
  in_progress: "bg-tint text-ink",
  done: "bg-ink text-white",
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold leading-none",
        styles[status],
        className,
      )}
    >
      {orderStatusLabels[status]}
    </span>
  );
}
