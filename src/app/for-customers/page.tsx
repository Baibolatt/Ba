import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Accordion } from "@/components/ui/accordion";
import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";

export const metadata: Metadata = {
  title: "Клиентам",
  description:
    "Доставка, оплата, возврат и гарантия в PartsHub: условия получения заказов со склада.",
};

const anchors = [
  { href: "#delivery", label: "Доставка" },
  { href: "#payment", label: "Оплата" },
  { href: "#returns", label: "Возврат и гарантия" },
  { href: "#faq", label: "Вопросы и ответы" },
];

const deliveryOptions: Array<{
  icon: IconName;
  title: string;
  text: string;
  note: string;
}> = [
  {
    icon: "mapPin",
    title: "Самовывоз со склада",
    text: "Тараз, ул. Жибек Жолы, 12. Заберите заказ в день оформления после подтверждения сборки.",
    note: "Сегодня",
  },
  {
    icon: "truck",
    title: "Доставка курьером",
    text: "По Таразу и Жамбылской области. Курьер приезжает после сборки заказа, время согласуем по телефону.",
    note: "На следующий день",
  },
];

const paymentOptions: Array<{
  icon: IconName;
  title: string;
  text: string;
}> = [
  {
    icon: "box",
    title: "При получении",
    text: "Наличными или картой в пункте выдачи.",
  },
  {
    icon: "creditCard",
    title: "Картой курьеру",
    text: "Оплата при доставке по адресу.",
  },
  {
    icon: "fileText",
    title: "По счёту для юрлица",
    text: "Счёт, накладные и закрывающие документы.",
  },
];

const faq = [
  {
    title: "Как узнать, есть ли деталь на складе?",
    content:
      "На странице товара показан статус наличия. Если указано «Мало», количество может измениться — уточните у менеджера перед крупным заказом.",
  },
  {
    title: "Можно ли забрать заказ сегодня?",
    content:
      "Да, если товары в наличии. После оформления мы собираем заказ и отправляем уведомление, что он готов к выдаче.",
  },
  {
    title: "Что нужно для получения по счёту?",
    content:
      "Реквизиты компании и контакт бухгалтера. Счёт выставим после подтверждения состава заказа, отгрузка — после оплаты.",
  },
  {
    title: "Как вернуть деталь?",
    content:
      "Товар без следов установки и с документами можно вернуть в течение 14 дней. Пришлите номер заказа через обратную связь — согласуем возврат.",
  },
  {
    title: "Даёте ли гарантию на запчасти?",
    content:
      "На товары действует гарантия 12 месяцев, если иное не указано в характеристиках. Гарантийные случаи рассматриваем по документам о покупке.",
  },
];

export default function ForCustomersPage() {
  return (
    <Container className="py-5 sm:py-8">
      <Breadcrumbs
        items={[{ label: "Главная", href: "/" }, { label: "Клиентам" }]}
      />

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        Клиентам
      </h1>
      <p className="mt-1.5 max-w-2xl text-sm text-muted">
        Как получить заказ, чем оплатить и что делать, если деталь не подошла.
        Условия одинаковы для розничных и оптовых покупателей.
      </p>

      <nav className="no-scrollbar mt-4 overflow-x-auto">
        <div className="flex min-w-max gap-2">
          {anchors.map((anchor) => (
            <Link
              key={anchor.href}
              href={anchor.href}
              className="inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-3.5 py-2 text-xs font-semibold text-muted transition-colors hover:border-brand/40 hover:bg-tint/40 hover:text-ink"
            >
              {anchor.label}
            </Link>
          ))}
        </div>
      </nav>

      <section id="delivery" className="mt-8 scroll-mt-24">
        <h2 className="text-lg font-bold text-ink sm:text-xl">Доставка</h2>
        <p className="mt-1 text-sm text-muted">
          Заказы собираются на складе в Таразе. Срок зависит от наличия.
        </p>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-2">
          {deliveryOptions.map((option) => (
            <div
              key={option.title}
              className="rounded-card border border-line bg-surface p-4 shadow-card"
            >
              <span className="flex size-10 items-center justify-center rounded-control bg-tint text-brand">
                <Icon name={option.icon} className="size-5" />
              </span>
              <h3 className="mt-3 text-sm font-bold text-ink">
                {option.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                {option.text}
              </p>
              <p className="mt-3 inline-flex rounded-full bg-tint px-2.5 py-1 text-[11px] font-semibold text-brand">
                {option.note}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="payment" className="mt-8 scroll-mt-24">
        <h2 className="text-lg font-bold text-ink sm:text-xl">Оплата</h2>
        <p className="mt-1 text-sm text-muted">
          Онлайн-оплата на сайте не подключена — выбирайте удобный способ при
          получении или по счёту.
        </p>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {paymentOptions.map((option) => (
            <div
              key={option.title}
              className="rounded-card border border-line bg-surface p-4 shadow-card"
            >
              <Icon name={option.icon} className="size-5 text-icon" />
              <h3 className="mt-3 text-sm font-bold text-ink">
                {option.title}
              </h3>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {option.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section id="returns" className="mt-8 scroll-mt-24">
        <div className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-control bg-brand-50 text-brand">
              <Icon name="rotateCcw" className="size-5" />
            </span>
            <h2 className="text-lg font-bold text-ink">Возврат и гарантия</h2>
          </div>
          <div className="mt-3 grid gap-4 text-sm text-muted sm:grid-cols-2">
            <div>
              <h3 className="font-semibold text-ink">Возврат 14 дней</h3>
              <p className="mt-1 text-xs leading-relaxed">
                Товар без следов установки, в оригинальной упаковке и с
                документами. Пришлите номер заказа через обратную связь.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-ink">Гарантия 12 месяцев</h3>
              <p className="mt-1 text-xs leading-relaxed">
                На заводской дефект. Для рассмотрения нужны заказ и документы о
                покупке; установку подтверждаем по чеку сервиса.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" className="mt-8 scroll-mt-24">
        <h2 className="text-lg font-bold text-ink sm:text-xl">
          Вопросы и ответы
        </h2>
        <div className="mt-4">
          <Accordion items={faq} />
        </div>
      </section>

      <div className="mt-8 flex flex-col gap-3 rounded-card border border-line bg-tint/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <div>
          <h2 className="text-sm font-bold text-ink">Остались вопросы?</h2>
          <p className="mt-1 text-xs text-muted">
            Напишите — ответим по условиям, наличию и документам.
          </p>
        </div>
        <ButtonLink href="/feedback" variant="primary">
          Обратная связь
        </ButtonLink>
      </div>
    </Container>
  );
}
