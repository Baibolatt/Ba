"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { Order } from "@/lib/types";
import { OrderRow } from "@/components/account/order-row";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";

type OrdersFilter = "all" | "active" | "done" | "cancelled";

const tabs: Array<{ value: OrdersFilter; label: string }> = [
  { value: "all", label: "Все" },
  { value: "active", label: "Активные" },
  { value: "done", label: "Завершённые" },
  { value: "cancelled", label: "Отменённые" },
];

function matchesFilter(order: Order, filter: OrdersFilter): boolean {
  if (filter === "active") {
    return order.status === "new" || order.status === "in_progress";
  }
  if (filter === "done" || filter === "cancelled") {
    return order.status === filter;
  }
  return true;
}

export function OrdersList({ orders }: { orders: Order[] }) {
  const [filter, setFilter] = useState<OrdersFilter>("all");

  const visible = orders.filter((order) => matchesFilter(order, filter));

  return (
    <div>
      <div className="flex flex-wrap gap-1 pb-1">
        {tabs.map((tab) => {
          const count = orders.filter((order) =>
            matchesFilter(order, tab.value),
          ).length;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              className={cn(
                "inline-flex min-h-11 shrink-0 items-center rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors",
                filter === tab.value
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-surface text-muted hover:border-brand/40 hover:text-ink",
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "ml-1.5",
                  filter === tab.value ? "text-white/70" : "text-muted/70",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {visible.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            icon="box"
            title="В этой группе заявок нет"
            description="Выберите другой фильтр или перейдите в каталог."
            action={<ButtonLink href="/catalog">Открыть каталог</ButtonLink>}
          />
        </div>
      ) : (
        <div className="mt-4 space-y-2.5">
          {visible.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </div>
      )}
    </div>
  );
}
