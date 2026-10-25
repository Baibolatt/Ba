import Link from "next/link";
import {
  formatPrice,
  orderItemsCount,
  type Order,
} from "@/lib/mock-data";
import { StatusBadge } from "@/components/ui/status-badge";
import { Icon } from "@/components/ui/icon";

type OrderRowProps = {
  order: Order;
};

export function OrderRow({ order }: OrderRowProps) {
  return (
    <Link
      href={`/account/orders/${order.id}`}
      className="flex flex-col gap-3 rounded-control border border-line p-3.5 transition-colors hover:border-brand/30 hover:bg-brand-50/40 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-accent-soft text-brand">
          <Icon name="box" className="size-5" />
        </span>
        <div>
          <p className="text-sm font-semibold text-ink">{order.number}</p>
          <p className="mt-0.5 text-xs text-muted">
            {order.date} · {orderItemsCount(order)} шт.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 sm:justify-end">
        <StatusBadge status={order.status} />
        <span className="text-sm font-bold text-ink">
          {formatPrice(order.total)}
        </span>
        <Icon name="chevronRight" className="size-4 text-line-strong" />
      </div>
    </Link>
  );
}
