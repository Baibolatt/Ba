import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { FeedbackForm } from "@/components/feedback/feedback-form";
import { Icon, type IconName } from "@/components/ui/icon";

export const metadata: Metadata = {
  title: "Обратная связь",
  description:
    "Напишите в PartsHub: подбор детали, вопрос по заказу, доставка, возврат и опт.",
};

const contacts: Array<{
  icon: IconName;
  title: string;
  value: string;
  href?: string;
}> = [
  {
    icon: "phone",
    title: "Телефон",
    value: "+7 (700) 000-00-00",
    href: "tel:+77000000000",
  },
  {
    icon: "mail",
    title: "Почта",
    value: "zakaz@partshub.kz",
    href: "mailto:zakaz@partshub.kz",
  },
  {
    icon: "mapPin",
    title: "Склад",
    value: "Тараз, ул. Жибек Жолы, 12",
  },
  {
    icon: "clock",
    title: "Часы работы",
    value: "Ежедневно, 9:00–20:00",
  },
];

export default function FeedbackPage() {
  return (
    <Container className="py-5 sm:py-8">
      <Breadcrumbs
        items={[{ label: "Главная", href: "/" }, { label: "Обратная связь" }]}
      />

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        Обратная связь
      </h1>
      <p className="mt-1.5 max-w-2xl text-sm text-muted">
        Поможем подобрать деталь, проверим заказ или разберёмся с возвратом.
        Напишите — ответим в рабочее время склада.
      </p>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.4fr_0.6fr] lg:items-start lg:gap-8">
        <FeedbackForm />

        <aside className="space-y-3">
          <div className="rounded-card border border-line bg-surface p-4 shadow-card">
            <h2 className="text-sm font-bold text-ink">Контакты</h2>
            <ul className="mt-3 space-y-3">
              {contacts.map((contact) => (
                <li key={contact.title} className="flex items-start gap-2.5">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-control bg-tint text-brand">
                    <Icon name={contact.icon} className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide text-muted">
                      {contact.title}
                    </p>
                    {contact.href ? (
                      <a
                        href={contact.href}
                        className="text-sm font-medium text-ink hover:text-brand-700"
                      >
                        {contact.value}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-ink">
                        {contact.value}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-card border border-line bg-surface p-4 shadow-card">
            <h2 className="text-sm font-bold text-ink">Быстрые ссылки</h2>
            <ul className="mt-2.5 space-y-1.5 text-sm">
              {[
                { href: "/for-customers#delivery", label: "Условия доставки" },
                { href: "/for-customers#payment", label: "Способы оплаты" },
                { href: "/for-customers#returns", label: "Возврат и гарантия" },
                { href: "/account/orders", label: "Мои заказы" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="flex items-center justify-between gap-2 rounded-control py-1.5 text-muted transition-colors hover:text-brand"
                  >
                    {link.label}
                    <Icon name="chevronRight" className="size-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-card border border-line bg-tint/60 p-4">
            <p className="text-xs leading-relaxed text-muted">
              Для оптовых заказов приложите список позиций и реквизиты
              компании — подготовим счёт.
            </p>
          </div>
        </aside>
      </div>
    </Container>
  );
}
