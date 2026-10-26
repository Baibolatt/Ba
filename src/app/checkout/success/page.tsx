import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { OrderSummary } from "@/components/cart/order-summary";
import { getOrderForViewer } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { orderStatusLabels } from "@/lib/format";
import { formatPhone } from "@/lib/phone";

export const metadata: Metadata = {
  title: "Заказ оформлен",
  description: "Подтверждение заказа PartsHub.",
};

// Заказ показывается только гостю-автору ссылки или владельцу сессии.
export const instant = false;

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

type CheckoutSuccessPageProps = {
  searchParams: Promise<{ order?: string | string[] }>;
};

async function SuccessContent({ searchParams }: CheckoutSuccessPageProps) {
  const { order: orderParam } = await searchParams;
  const orderId = typeof orderParam === "string" ? orderParam : "";
  const viewer = await getCurrentUser();
  const order = orderId
    ? await getOrderForViewer(orderId, viewer?.id ?? null)
    : null;

  if (!order) {
    return (
      <section className="mt-5 rounded-card border border-line bg-surface p-5 text-center shadow-card sm:p-8">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-danger-soft text-danger">
          <Icon name="alertCircle" className="size-8" />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Заказ не найден
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Возможно, ссылка устарела. Откройте историю заказов или вернитесь в
          каталог.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <ButtonLink href="/account/orders" variant="primary">
            Мои заказы
            <Icon name="arrowRight" className="size-4" />
          </ButtonLink>
          <ButtonLink href="/catalog" variant="secondary">
            В каталог
          </ButtonLink>
        </div>
      </section>
    );
  }

  const lines = order.lines.map((line) => ({
    product: line.product,
    qty: line.qty,
    price: line.price,
  }));

  return (
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
              {order.number}
            </span>
            . Заказ сохранён. Мы свяжемся с вами по телефону{" "}
            {formatPhone(order.phone)}, чтобы подтвердить состав и время получения.
          </p>

          <div className="mt-6 grid gap-2 sm:grid-cols-3">
            <div className="rounded-control bg-page p-3 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Получение
              </p>
              <p className="mt-1 text-xs font-medium text-ink">
                {order.delivery}
              </p>
            </div>
            <div className="rounded-control bg-page p-3 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Оплата
              </p>
              <p className="mt-1 text-xs font-medium text-ink">
                {order.payment}
              </p>
            </div>
            <div className="rounded-control bg-page p-3 text-left">
              <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                Статус
              </p>
              <p className="mt-1 text-xs font-medium text-ink">
                {orderStatusLabels[order.status]}
              </p>
            </div>
          </div>

          <dl className="mt-3 grid gap-3 rounded-control border border-line p-3 text-left text-xs sm:grid-cols-2">
            <div>
              <dt className="text-muted">Адрес</dt>
              <dd className="mt-1 font-medium text-ink">{order.address}</dd>
            </div>
            <div>
              <dt className="text-muted">Дата оформления</dt>
              <dd className="mt-1 font-medium text-ink">{order.date}</dd>
            </div>
          </dl>

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
                  <p className="text-sm font-semibold text-ink">{item.title}</p>
                  <p className="mt-0.5 text-xs leading-relaxed text-muted">
                    {item.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <OrderSummary lines={lines} title="Состав заказа" />
    </div>
  );
}

export default function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
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

      <Suspense
        fallback={
          <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6">
            <div className="h-96 animate-pulse rounded-card border border-line bg-surface" />
            <div className="h-64 animate-pulse rounded-card border border-line bg-surface" />
          </div>
        }
      >
        <SuccessContent searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}
