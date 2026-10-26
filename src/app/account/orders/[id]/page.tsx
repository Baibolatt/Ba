import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AccountShell } from "@/components/account/account-shell";
import { CartItem } from "@/components/cart/cart-item";
import { StatusBadge } from "@/components/ui/status-badge";
import { Icon } from "@/components/ui/icon";
import { getOrderForUser } from "@/lib/data";
import { getCurrentUser, requireUser } from "@/lib/auth";
import { formatPrice, orderItemsCount } from "@/lib/format";
import { formatPhone } from "@/lib/phone";

type OrderPageProps = {
  params: Promise<{ id: string }>;
};

const timeline = [
  {
    title: "Заказ принят",
    text: "Менеджер подтвердил состав и наличие.",
  },
  {
    title: "Сборка",
    text: "Товары отбираются на складе.",
  },
  {
    title: "Готов к выдаче",
    text: "Можно забрать или передать курьеру.",
  },
  {
    title: "Получен",
    text: "Заказ закрыт, документы переданы.",
  },
];

export async function generateMetadata({
  params,
}: OrderPageProps): Promise<Metadata> {
  const { id } = await params;
  const user = await getCurrentUser();
  const order = user ? await getOrderForUser(id, user.id) : null;

  if (!order) return { title: "Заказ не найден" };

  return {
    title: `Заказ ${order.number}`,
    description: `Детали заказа ${order.number} от ${order.date}.`,
  };
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;
  const user = await requireUser();
  const order = await getOrderForUser(id, user.id);

  if (!order) notFound();

  const lines = order.lines;

  const completed =
    order.status === "done"
      ? timeline.length
      : order.status === "in_progress"
        ? 2
        : 1;

  return (
    <AccountShell
      title={`Заказ ${order.number}`}
      description={`${order.date} · ${orderItemsCount(order)} шт.`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <StatusBadge status={order.status} />
        <Link
          href="/account/orders"
          className="flex items-center gap-1 text-xs font-semibold text-brand transition-colors hover:text-brand-700"
        >
          <Icon name="arrowLeft" className="size-3.5" />
          Ко всем заказам
        </Link>
      </div>

      <section className="mt-4 rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
        <h2 className="text-base font-bold text-ink">Статус заказа</h2>
        <ol className="mt-4 space-y-4">
          {timeline.map((item, index) => {
            const done = index < completed;
            const current = index === completed && completed < timeline.length;

            return (
              <li key={item.title} className="flex gap-3">
                <span
                  className={
                    done || current
                      ? "flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-white"
                      : "flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-muted"
                  }
                >
                  {done ? (
                    <Icon name="check" className="size-3.5" strokeWidth={2.5} />
                  ) : (
                    <span className="size-2 rounded-full bg-current" />
                  )}
                </span>
                <div className="pt-0.5">
                  <p
                    className={
                      done || current
                        ? "text-sm font-semibold text-ink"
                        : "text-sm font-semibold text-muted"
                    }
                  >
                    {item.title}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">
                    {item.text}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 rounded-card border border-line bg-surface shadow-card">
          <div className="border-b border-line px-4 py-3">
            <h2 className="text-sm font-bold text-ink">
              Состав заказа{" "}
              <span className="font-normal text-muted">
                · {orderItemsCount(order)} шт.
              </span>
            </h2>
          </div>
          <div className="divide-y divide-line px-4">
            {lines.map((line) => (
              <CartItem
                key={line.product.id}
                product={line.product}
                qty={line.qty}
                unitPrice={line.price}
                compact
              />
            ))}
          </div>
        </section>

        <section className="rounded-card border border-line bg-surface p-4 shadow-card">
          <h2 className="text-base font-bold text-ink">Детали</h2>
          <dl className="mt-3 space-y-2.5 text-sm">
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted">Номер</dt>
              <dd className="text-right font-mono text-xs font-semibold text-ink">
                {order.number}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted">Дата</dt>
              <dd className="text-right text-ink">{order.date}</dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted">Получатель</dt>
              <dd className="max-w-[60%] text-right text-ink">
                {order.customerName}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted">Телефон</dt>
              <dd className="max-w-[60%] text-right text-ink">
                {formatPhone(order.phone)}
              </dd>
            </div>
            {order.email ? (
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted">Email</dt>
                <dd className="max-w-[60%] break-all text-right text-ink">
                  <a className="hover:text-brand" href={`mailto:${order.email}`}>
                    {order.email}
                  </a>
                </dd>
              </div>
            ) : null}
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted">Получение</dt>
              <dd className="max-w-[60%] text-right text-ink">
                {order.delivery}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted">Адрес</dt>
              <dd className="max-w-[60%] text-right text-ink">
                {order.address}
              </dd>
            </div>
            <div className="flex items-start justify-between gap-3">
              <dt className="text-muted">Оплата</dt>
              <dd className="max-w-[60%] text-right text-ink">
                {order.payment}
              </dd>
            </div>
            {order.comment ? (
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted">Комментарий</dt>
                <dd className="max-w-[60%] text-right text-ink">
                  {order.comment}
                </dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
              <dt className="font-bold text-ink">Итого</dt>
              <dd className="text-base font-bold text-brand">
                {formatPrice(order.total)}
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </AccountShell>
  );
}
