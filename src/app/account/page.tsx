import type { Metadata } from "next";
import Link from "next/link";
import { AccountShell } from "@/components/account/account-shell";
import { OrderRow } from "@/components/account/order-row";
import { Icon, type IconName } from "@/components/ui/icon";
import { notifications, orders, profile } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Личный кабинет",
  description: "Обзор заказов, избранного и уведомлений PartsHub.",
};

const quickLinkMeta: Array<{
  href: string;
  title: string;
  hint: string;
  icon: IconName;
  value?: string;
}> = [
  {
    href: "/account/orders",
    title: "Заказы",
    hint: "История и статусы",
    icon: "box",
    value: String(orders.length),
  },
  {
    href: "/account/favorites",
    title: "Избранное",
    hint: "Сохранённые товары",
    icon: "heart",
  },
  {
    href: "/account/notifications",
    title: "Уведомления",
    hint: "События по заказам",
    icon: "bell",
    value: String(notifications.filter((item) => !item.read).length),
  },
  {
    href: "/account/profile",
    title: "Профиль",
    hint: "Контакты и адрес",
    icon: "user",
  },
];

export default function AccountPage() {
  const unread = notifications.filter((item) => !item.read).length;
  const recentOrders = orders.slice(0, 2);

  return (
    <AccountShell
      title="Личный кабинет"
      description="Заказы, избранное и контактные данные."
    >
      <section className="relative overflow-hidden rounded-card bg-ink p-4 text-white sm:p-5">
        <div
          className="pointer-events-none absolute -right-10 -top-12 size-40 rounded-full border border-white/10"
          aria-hidden="true"
        />
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-white/60">
          С возвращением
        </p>
        <h2 className="mt-1 text-xl font-bold">
          Здравствуйте, {profile.name}!
        </h2>
        <p className="mt-1.5 max-w-md text-sm text-white/70">
          {unread > 0
            ? `У вас ${unread} новых уведомления и ${orders.length} заказа в истории.`
            : `В истории ${orders.length} заказа. Новых уведомлений нет.`}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/account/orders"
            className="inline-flex h-11 items-center rounded-control bg-brand px-4 text-sm font-bold text-white transition-colors hover:bg-brand-800"
          >
            Мои заказы
          </Link>
          <Link
            href="/account/profile"
            className="inline-flex h-11 items-center rounded-control border border-white/25 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Профиль
          </Link>
        </div>
      </section>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {quickLinkMeta.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-card border border-line bg-surface p-3.5 shadow-card transition-colors hover:border-brand/30"
          >
            <div className="flex items-start justify-between">
              <span className="flex size-9 items-center justify-center rounded-control bg-tint text-icon">
                <Icon name={item.icon} className="size-5" />
              </span>
              <Icon
                name="chevronRight"
                className="size-4 text-line-strong transition-colors group-hover:text-brand"
              />
            </div>
            <p className="mt-3 text-sm font-semibold text-ink">{item.title}</p>
            <p className="mt-0.5 text-xs text-muted">
              {item.value ? (
                <span className="font-semibold text-brand">{item.value} · </span>
              ) : null}
              {item.hint}
            </p>
          </Link>
        ))}
      </div>

      <section className="mt-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-bold text-ink">Последние заказы</h2>
          <Link
            href="/account/orders"
            className="flex items-center gap-1 text-xs font-semibold text-brand transition-colors hover:text-brand-700"
          >
            Все заказы
            <Icon name="chevronRight" className="size-3.5" />
          </Link>
        </div>
        <div className="mt-3 space-y-2.5">
          {recentOrders.map((order) => (
            <OrderRow key={order.id} order={order} />
          ))}
        </div>
      </section>

      <div className="mt-5 flex items-start gap-3 rounded-card border border-line bg-surface p-4 shadow-card">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-control bg-brand-50 text-brand">
          <Icon name="mail" className="size-5" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-ink">Не нашли деталь?</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Напишите артикул — проверим наличие на складе и предложим аналог.
          </p>
          <Link
            href="/feedback"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-700"
          >
            Обратная связь
            <Icon name="arrowRight" className="size-3.5" />
          </Link>
        </div>
      </div>
    </AccountShell>
  );
}
