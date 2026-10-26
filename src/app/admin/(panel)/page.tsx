import type { Metadata } from "next";
import { ButtonLink } from "@/components/ui/button";
import { OrderStatusForm } from "@/components/admin/order-status-form";
import { ProductStockForm } from "@/components/admin/product-stock-form";
import { SectionHeading } from "@/components/ui/section-heading";
import { StatusBadge } from "@/components/ui/status-badge";
import { StockBadge } from "@/components/ui/stock-badge";
import { getOrders, getProducts } from "@/lib/data";
import {
  formatPrice,
  orderItemsCount,
  stockLevel,
} from "@/lib/format";
import { formatPhone } from "@/lib/phone";

export const metadata: Metadata = {
  title: "Заказы и товары",
};

export default async function AdminPage() {
  const [orders, products] = await Promise.all([getOrders(), getProducts()]);

  const newOrders = orders.filter((order) => order.status === "new").length;
  const outOfStock = products.filter((product) => !product.inStock).length;

  return (
    <div className="space-y-5">
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-card border border-line bg-surface p-3.5 shadow-card">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Заказов
          </dt>
          <dd className="mt-1 text-xl font-bold text-ink">{orders.length}</dd>
        </div>
        <div className="rounded-card border border-line bg-surface p-3.5 shadow-card">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Новых
          </dt>
          <dd className="mt-1 text-xl font-bold text-brand">{newOrders}</dd>
        </div>
        <div className="rounded-card border border-line bg-surface p-3.5 shadow-card">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Товаров
          </dt>
          <dd className="mt-1 text-xl font-bold text-ink">{products.length}</dd>
        </div>
        <div className="rounded-card border border-line bg-surface p-3.5 shadow-card">
          <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
            Нет в наличии
          </dt>
          <dd className="mt-1 text-xl font-bold text-danger">{outOfStock}</dd>
        </div>
      </dl>

      <section className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
        <div className="border-b border-line p-4 sm:p-5">
          <SectionHeading
            title="Заказы"
            description="Новые заказы сверху. Смена статуса сохраняется сразу."
          />
        </div>

        {orders.length === 0 ? (
          <p className="p-5 text-sm text-muted">Заказов пока нет.</p>
        ) : (
          <ul className="divide-y divide-line">
            {orders.map((order) => (
              <li key={order.id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-mono text-sm font-bold text-ink">
                        {order.number}
                      </p>
                      <StatusBadge status={order.status} />
                    </div>
                    <p className="mt-1.5 text-xs text-muted">
                      {order.date} · {orderItemsCount(order)} шт. ·{" "}
                      {formatPrice(order.total)}
                    </p>
                    <p className="mt-2 text-sm font-medium text-ink">
                      {order.customerName}
                    </p>
                    <p className="text-xs text-muted">
                      {formatPhone(order.phone)}
                      {order.email ? ` · ${order.email}` : ""}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {order.delivery} · {order.address}
                    </p>
                    {order.comment ? (
                      <p className="mt-1 text-xs text-muted">
                        Комментарий: {order.comment}
                      </p>
                    ) : null}
                  </div>

                  <OrderStatusForm
                    orderId={order.id}
                    status={order.status}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
        <div className="border-b border-line p-4 sm:p-5">
          <SectionHeading
            title="Товары"
            description="Цена в тенге и остаток на складе. Ноль остатка означает «Нет в наличии»."
            action={
              <ButtonLink
                href="/admin/import"
                variant="secondary"
                size="sm"
              >
                Импорт из Excel/CSV
              </ButtonLink>
            }
          />
        </div>

        {products.length === 0 ? (
          <p className="p-5 text-sm text-muted">Товаров пока нет.</p>
        ) : (
          <ul className="divide-y divide-line">
            {products.map((product) => (
              <li key={product.id} className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-ink">
                        {product.name}
                      </p>
                      <StockBadge
                        level={stockLevel(product)}
                        stock={product.quantity}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted">
                      {product.article} · {product.brand} ·{" "}
                      {product.categoryName}
                    </p>
                  </div>

                  <ProductStockForm
                    productId={product.id}
                    price={product.price}
                    quantity={product.quantity}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
