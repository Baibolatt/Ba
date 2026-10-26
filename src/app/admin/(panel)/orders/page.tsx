import type { Metadata } from "next";
import Link from "next/link";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { fieldControlClass } from "@/components/ui/form-fields";
import { requireAdmin } from "@/lib/admin-auth";
import { getOrders, getProducts } from "@/lib/data";
import { formatPrice, orderItemsCount } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import type { OrderStatus } from "@/lib/types";

export const metadata: Metadata = {
  title: "Заказы",
};

type OrdersPageProps = {
  searchParams: Promise<{
    status?: string | string[];
    q?: string | string[];
  }>;
};

const statusTabs = [
  { value: "all", label: "Все" },
  { value: "new", label: "Новые" },
  { value: "in_progress", label: "В работе" },
  { value: "done", label: "Выполненные" },
  { value: "cancelled", label: "Отменённые" },
] as const;

type StatusFilter = (typeof statusTabs)[number]["value"];

function single(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function normalizeStatus(value: string): StatusFilter {
  return statusTabs.some((tab) => tab.value === value)
    ? (value as StatusFilter)
    : "all";
}

function ordersHref(status: StatusFilter, query: string): string {
  const params = new URLSearchParams();
  if (status !== "all") params.set("status", status);
  if (query) params.set("q", query);
  const search = params.toString();
  return search ? `/admin/orders?${search}` : "/admin/orders";
}

export default async function AdminOrdersPage({
  searchParams,
}: OrdersPageProps) {
  await requireAdmin();

  const [orders, products, params] = await Promise.all([
    getOrders(),
    getProducts(),
    searchParams,
  ]);

  const status = normalizeStatus(single(params.status));
  const query = single(params.q).trim();
  const needle = query.toLowerCase();
  const productNames = new Map(
    products.map((product) => [product.id, product.name]),
  );

  const counts: Record<StatusFilter, number> = {
    all: orders.length,
    new: orders.filter((order) => order.status === "new").length,
    in_progress: orders.filter((order) => order.status === "in_progress")
      .length,
    done: orders.filter((order) => order.status === "done").length,
    cancelled: orders.filter((order) => order.status === "cancelled").length,
  };

  const filtered = orders.filter((order) => {
    if (status !== "all" && order.status !== status) return false;
    if (!needle) return true;

    return [
      order.number,
      order.customerName,
      order.phone,
      order.email ?? "",
    ]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-ink">Заказы</h2>
        <p className="mt-0.5 text-sm text-muted">
          Найдено {filtered.length} из {orders.length}. Статус сохраняется
          сразу.
        </p>
      </div>

      <div className="flex flex-wrap gap-1 rounded-card border border-line bg-surface p-1.5 shadow-card">
        {statusTabs.map((tab) => {
          const active = tab.value === status;
          return (
            <Link
              key={tab.value}
              href={ordersHref(tab.value, query)}
              aria-current={active ? "page" : undefined}
              className={[
                "flex min-h-10 shrink-0 items-center gap-1.5 rounded-control px-3 py-2 text-xs font-semibold transition-colors",
                active
                  ? "bg-brand text-white"
                  : "text-muted hover:bg-brand-50 hover:text-ink",
              ].join(" ")}
            >
              {tab.label}
              <span
                className={[
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  active ? "bg-white/20 text-white" : "bg-page text-muted",
                ].join(" ")}
              >
                {counts[tab.value]}
              </span>
            </Link>
          );
        })}
      </div>

      <form
        method="get"
        action="/admin/orders"
        className="flex flex-wrap items-center gap-2 rounded-card border border-line bg-surface p-3 shadow-card"
      >
        {status !== "all" ? (
          <input type="hidden" name="status" value={status} />
        ) : null}
        <label className="relative min-w-0 flex-1 basis-48">
          <span className="sr-only">Поиск по заказам</span>
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Номер, имя, телефон или email"
            className={`${fieldControlClass(false)} h-11 pl-9`}
          />
        </label>
        <div className="flex gap-2">
          <Button type="submit" size="sm" className="flex-1 sm:flex-none">
            Найти
          </Button>
          {query || status !== "all" ? (
            <ButtonLink
              href="/admin/orders"
              variant="secondary"
              size="sm"
              className="flex-1 sm:flex-none"
            >
              Сбросить
            </ButtonLink>
          ) : null}
        </div>
      </form>

      {filtered.length === 0 ? (
        <EmptyState
          icon="box"
          title={orders.length === 0 ? "Заказов пока нет" : "Ничего не найдено"}
          description={
            orders.length === 0
              ? "Новые заказы появятся здесь автоматически."
              : "Измените запрос или сбросьте фильтры."
          }
          action={
            orders.length > 0 ? (
              <ButtonLink href="/admin/orders" variant="secondary">
                Показать все заказы
              </ButtonLink>
            ) : undefined
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((order) => (
            <li
              key={order.id}
              className="rounded-card border border-line bg-surface shadow-card"
            >
              <div className="flex flex-col gap-4 p-4 sm:p-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-mono text-sm font-bold text-ink">
                      {order.number}
                    </p>
                    <StatusBadge status={order.status} />
                    <span className="text-xs text-muted">{order.date}</span>
                  </div>

                  <div className="mt-2 grid gap-1 text-sm sm:grid-cols-2 sm:gap-x-6">
                    <p className="font-medium text-ink">
                      {order.customerName}
                    </p>
                    <p className="text-muted">
                      {formatPhone(order.phone)}
                      {order.email ? ` · ${order.email}` : ""}
                    </p>
                    <p className="text-xs text-muted">
                      {order.delivery} · {order.address}
                    </p>
                    <p className="text-xs text-muted">
                      {orderItemsCount(order)} шт. ·{" "}
                      <span className="font-semibold text-ink">
                        {formatPrice(order.total)}
                      </span>
                    </p>
                  </div>

                  {order.comment ? (
                    <p className="mt-2 rounded-control bg-page px-3 py-2 text-xs text-muted">
                      Комментарий: {order.comment}
                    </p>
                  ) : null}

                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs font-semibold text-brand">
                      Состав заказа
                    </summary>
                    <ul className="mt-2 space-y-1.5 rounded-control bg-page p-3">
                      {order.items.map((item) => (
                        <li
                          key={item.productId}
                          className="flex items-start justify-between gap-3 text-xs"
                        >
                          <span className="min-w-0 text-ink">
                            {productNames.get(item.productId) ?? item.productId}
                          </span>
                          <span className="shrink-0 text-muted">
                            {item.qty} × {formatPrice(item.price)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </details>
                </div>

                <div className="shrink-0 border-t border-line pt-3 lg:border-0 lg:pt-0">
                  <OrderStatusForm
                    orderId={order.id}
                    status={order.status as OrderStatus}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
