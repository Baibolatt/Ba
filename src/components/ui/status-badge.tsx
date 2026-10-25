import { cn } from "@/lib/cn";
import { orderStatusLabels, type OrderStatus } from "@/lib/mock-data";

type StatusBadgeProps = {
  status: OrderStatus;
  className?: string;
};

const styles: Record<OrderStatus, string> = {
  processing: "bg-brand-50 text-brand",
  assembling: "bg-tint text-ink",
  delivered: "bg-ink text-white",
  cancelled: "border border-line bg-page text-muted",
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
