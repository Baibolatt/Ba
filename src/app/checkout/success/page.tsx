import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { OrderSummary } from "@/components/cart/order-summary";
import { getProductsByIds } from "@/lib/data";

export const metadata: Metadata = {
  title: "Заказ оформлен",
  description: "Подтверждение заказа PartsHub.",
};

const successItems = [
  { id: "tl-2418", qty: 2 },
  { id: "gf-1042", qty: 1 },
];

const nextSteps = [
  {
    title: "Сборка",
    text: "Проверим наличие и соберём заказ в течение дня.",
  },
  {
    title: "Готов к выдаче",
    text: "Отправим уведомление в личный кабинет.",
  },
  {
    title: "Получение",
    text: "Заберите заказ по адресу склада или дождитесь курьера.",
  },
];

export default async function CheckoutSuccessPage() {
  const products = await getProductsByIds(successItems.map((item) => item.id));
  const successLines = successItems.flatMap(({ id, qty }) => {
    const product = products.find((item) => item.id === id);
    return product ? [{ product, qty }] : [];
  });

  return (
    <Container className="py-5 sm:py-8">
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Корзина", href: "/cart" },
          { label: "Оформление", href: "/checkout" },
          { label: "Готово" },
        ]}
      />

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6">
        <div className="space-y-4">
          <section className="rounded-card border border-line bg-surface p-5 text-center shadow-card sm:p-8">
            <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-tint text-icon">
              <Icon name="check" className="size-8" strokeWidth={2.5} />
            </span>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
              Заказ оформлен
            </h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
              Номер заказа{" "}
              <span className="font-mono font-semibold text-ink">
                PH-261025-01
              </span>
              . Мы отправили состав в личный кабинет и уведомим, когда заказ
              будет готов.
            </p>

            <div className="mt-6 grid gap-2 sm:grid-cols-3">
              <div className="rounded-control bg-page p-3 text-left">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                  Получение
                </p>
                <p className="mt-1 text-xs font-medium text-ink">
                  Самовывоз · Жибек Жолы, 12
                </p>
              </div>
              <div className="rounded-control bg-page p-3 text-left">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                  Оплата
                </p>
                <p className="mt-1 text-xs font-medium text-ink">
                  При получении
                </p>
              </div>
              <div className="rounded-control bg-page p-3 text-left">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                  Статус
                </p>
                <p className="mt-1 text-xs font-medium text-ink">
                  Новая
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <ButtonLink href="/account/orders" variant="primary">
                Перейти в заказы
                <Icon name="arrowRight" className="size-4" />
              </ButtonLink>
              <ButtonLink href="/catalog" variant="secondary">
                Вернуться в каталог
              </ButtonLink>
            </div>
          </section>

          <section className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
            <h2 className="text-base font-bold text-ink">Что дальше</h2>
            <ol className="mt-4 space-y-4">
              {nextSteps.map((item, index) => (
                <li key={item.title} className="flex gap-3">
                  <span
                    className={
                      index === 0
                        ? "flex size-7 shrink-0 items-center justify-center rounded-full bg-brand text-xs font-bold text-white"
                        : "flex size-7 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-xs font-bold text-muted"
                    }
                  >
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {item.title}
                    </p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted">
                      {item.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          <p className="rounded-control bg-page p-3 text-[11px] leading-relaxed text-muted">
            Демо-режим: заказ не сохраняется в базе, оплата не проводится.
            Страница показывает, как выглядит подтверждение.
          </p>
        </div>

        <OrderSummary lines={successLines} title="Состав заказа" />
      </div>
    </Container>
  );
}
