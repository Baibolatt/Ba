import type { Metadata } from "next";
import Link from "next/link";
import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { StatusBadge } from "@/components/ui/status-badge";
import { StockBadge } from "@/components/ui/stock-badge";
import { requireAdmin } from "@/lib/admin-auth";
import { getOrders, getProducts } from "@/lib/data";
import { formatPrice, stockLevel } from "@/lib/format";
import { formatPhone } from "@/lib/phone";

export const metadata: Metadata = {
  title: "Обзор",
};

type Stat = {
  label: string;
  value: number;
  href: string;
  icon: IconName;
  tone?: "brand" | "danger";
};

export default async function AdminPage() {
  await requireAdmin();

  const [orders, products] = await Promise.all([getOrders(), getProducts()]);

  const newOrders = orders.filter((order) => order.status === "new").length;
  const outOfStock = products.filter((product) => !product.inStock).length;
  const recentOrders = orders.slice(0, 5);
  const lowStock = products
    .filter((product) => product.quantity <= 5)
    .sort((left, right) => left.quantity - right.quantity)
    .slice(0, 6);

  const stats: Stat[] = [
    {
      label: "Всего заказов",
      value: orders.length,
      href: "/admin/orders",
      icon: "box",
    },
    {
      label: "Новых",
      value: newOrders,
      href: "/admin/orders?status=new",
      icon: "bell",
      tone: "brand",
    },
    {
      label: "Товаров",
      value: products.length,
      href: "/admin/products",
      icon: "listView",
    },
    {
      label: "Нет в наличии",
      value: outOfStock,
      href: "/admin/products?stock=out",
      icon: "alertCircle",
      tone: "danger",
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {stats.map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="group rounded-card border border-line bg-surface p-3.5 shadow-card transition-colors hover:border-brand/40 hover:bg-brand-50/40"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                {stat.label}
              </p>
              <Icon
                name={stat.icon}
                className="size-4 text-muted transition-colors group-hover:text-brand"
              />
            </div>
            <p
              className={[
                "mt-1 text-2xl font-bold",
                stat.tone === "brand"
                  ? "text-brand"
                  : stat.tone === "danger"
                    ? "text-danger"
                    : "text-ink",
              ].join(" ")}
            >
              {stat.value}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line p-4 sm:p-5">
            <div>
              <h2 className="text-base font-bold text-ink">Последние заказы</h2>
              <p className="mt-0.5 text-xs text-muted">
                Свежие заказы и их статусы
              </p>
            </div>
            <ButtonLink
              href="/admin/orders"
              variant="secondary"
              size="sm"
            >
              Все заказы
              <Icon name="arrowRight" className="size-4" />
            </ButtonLink>
          </div>

          {recentOrders.length === 0 ? (
            <p className="p-5 text-sm text-muted">Заказов пока нет.</p>
          ) : (
            <ul className="divide-y divide-line">
              {recentOrders.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders?q=${encodeURIComponent(order.number)}`}
                    className="flex flex-col gap-2 p-4 transition-colors hover:bg-brand-50/40 sm:flex-row sm:items-center sm:justify-between sm:p-5"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-ink">
                          {order.number}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="mt-1 truncate text-sm text-ink">
                        {order.customerName}
                      </p>
                      <p className="text-xs text-muted">
                        {formatPhone(order.phone)} · {order.date}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-ink">
                      {formatPrice(order.total)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-5">
          <section className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
            <div className="flex items-center justify-between gap-2 border-b border-line p-4">
              <h2 className="text-base font-bold text-ink">Заканчивается</h2>
              <ButtonLink
                href="/admin/products?stock=low"
                variant="secondary"
                size="sm"
              >
                Все товары
              </ButtonLink>
            </div>

            {lowStock.length === 0 ? (
              <p className="p-4 text-sm text-muted">
                Все товары в достаточном количестве.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {lowStock.map((product) => (
                  <li key={product.id}>
                    <Link
                      href={`/admin/products/${product.id}`}
                      className="flex items-center justify-between gap-3 p-4 transition-colors hover:bg-brand-50/40"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-ink">
                          {product.name}
                        </p>
                        <p className="text-xs text-muted">
                          {product.article} · {product.brand}
                        </p>
                      </div>
                      <StockBadge
                        level={stockLevel(product)}
                        stock={product.quantity}
                        className="shrink-0"
                      />
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-card border border-line bg-surface p-4 shadow-card">
            <h2 className="text-base font-bold text-ink">Быстрые действия</h2>
            <div className="mt-3 space-y-2">
              <ButtonLink
                href="/admin/products/new"
                className="w-full justify-start"
              >
                <Icon name="plus" className="size-4" />
                Добавить товар
              </ButtonLink>
              <ButtonLink
                href="/admin/import"
                variant="secondary"
                className="w-full justify-start"
              >
                <Icon name="fileText" className="size-4" />
                Импорт из Excel/CSV
              </ButtonLink>
              <ButtonLink
                href="/admin/catalog"
                variant="secondary"
                className="w-full justify-start"
              >
                <Icon name="settings" className="size-4" />
                Бренды и категории
              </ButtonLink>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
