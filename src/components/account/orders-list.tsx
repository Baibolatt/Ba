"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import type { Order } from "@/lib/mock-data";
import { OrderRow } from "@/components/account/order-row";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";

type OrdersFilter = "all" | "active" | "done";

const tabs: Array<{ value: OrdersFilter; label: string }> = [
  { value: "all", label: "Все" },
  { value: "active", label: "Активные" },
  { value: "done", label: "Завершённые" },
];

export function OrdersList({ orders }: { orders: Order[] }) {
  const [filter, setFilter] = useState<OrdersFilter>("all");

  const visible = orders.filter((order) => {
    if (filter === "active") {
      return order.status === "processing" || order.status === "assembling";
    }
    if (filter === "done") {
      return order.status === "delivered" || order.status === "cancelled";
    }
    return true;
  });

  return (
    <div>
      <div className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {tabs.map((tab) => {
          const count =
            tab.value === "all"
              ? orders.length
              : tab.value === "active"
                ? orders.filter(
                    (order) =>
                      order.status === "processing" ||
                      order.status === "assembling",
                  ).length
                : orders.filter(
                    (order) =>
                      order.status === "delivered" ||
                      order.status === "cancelled",
                  ).length;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => setFilter(tab.value)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors",
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
            title="В этой группе заказов нет"
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
