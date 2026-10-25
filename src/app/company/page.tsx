import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";

export const metadata: Metadata = {
  title: "Компания",
  description:
    "PartsHub — оптовый склад автозапчастей: о компании, преимущества, реквизиты и контакты.",
};

const stats = [
  { value: "6", label: "категорий" },
  { value: "12", label: "позиций в демо-каталоге" },
  { value: "14", label: "дней на возврат" },
  { value: "12", label: "месяцев гарантии" },
];

const advantages: Array<{ icon: IconName; title: string; text: string }> = [
  {
    icon: "box",
    title: "Собственный склад",
    text: "Ходовые позиции хранятся в Таразе — самовывоз в день заказа.",
  },
  {
    icon: "shield",
    title: "Проверенные поставщики",
    text: "Работаем с дистрибьюторами и проверяем документы на партии.",
  },
  {
    icon: "fileText",
    title: "Документы для юрлиц",
    text: "Счёт, накладные и закрывающие документы для бухгалтерии.",
  },
];

const requisites = [
  { label: "Наименование", value: "ТОО «PartsHub»" },
  { label: "БИН", value: "000000000000" },
  { label: "Кбе", value: "17" },
  { label: "Юридический адрес", value: "Тараз, ул. Жибек Жолы, 12" },
];

export default function CompanyPage() {
  return (
    <Container className="py-5 sm:py-8">
      <Breadcrumbs
        items={[{ label: "Главная", href: "/" }, { label: "Компания" }]}
      />

      <div className="mt-4 grid gap-5 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-10">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            О компании
          </p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Склад, который держит ходовые запчасти рядом
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            PartsHub — оптовый склад автозапчастей в Таразе. Мы собрали
            категории, которые чаще всего нужны для обслуживания автомобиля:
            тормозную систему, фильтры, масла, двигатель, подвеску и электрику.
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Работаем с розничными покупателями и юрлицами. На сайте показываем
            наличие и цену, а комплектацию и документы подтверждаем при сборке
            заказа.
          </p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            <ButtonLink href="/catalog" variant="accent">
              Открыть каталог
            </ButtonLink>
            <ButtonLink href="/feedback" variant="secondary">
              Связаться с нами
            </ButtonLink>
          </div>
        </div>

        <div className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
          <div className="flex items-center gap-2.5">
            <span className="flex size-10 items-center justify-center rounded-control bg-ink text-white">
              <Icon name="wrench" className="size-5" />
            </span>
            <div>
              <p className="text-sm font-bold text-ink">PartsHub</p>
              <p className="text-xs text-muted">Оптовый склад автозапчастей</p>
            </div>
          </div>
          <dl className="mt-4 space-y-2.5 text-sm">
            <div className="flex items-start gap-3">
              <dt className="flex w-24 shrink-0 items-center gap-1.5 text-muted">
                <Icon name="mapPin" className="size-3.5" />
                Адрес
              </dt>
              <dd className="text-ink">Тараз, ул. Жибек Жолы, 12</dd>
            </div>
            <div className="flex items-start gap-3">
              <dt className="flex w-24 shrink-0 items-center gap-1.5 text-muted">
                <Icon name="clock" className="size-3.5" />
                Часы
              </dt>
              <dd className="text-ink">Ежедневно, 9:00–20:00</dd>
            </div>
            <div className="flex items-start gap-3">
              <dt className="flex w-24 shrink-0 items-center gap-1.5 text-muted">
                <Icon name="phone" className="size-3.5" />
                Телефон
              </dt>
              <dd>
                <a
                  href="tel:+77000000000"
                  className="font-medium text-ink hover:text-brand-700"
                >
                  +7 (700) 000-00-00
                </a>
              </dd>
            </div>
            <div className="flex items-start gap-3">
              <dt className="flex w-24 shrink-0 items-center gap-1.5 text-muted">
                <Icon name="mail" className="size-3.5" />
                Почта
              </dt>
              <dd>
                <a
                  href="mailto:zakaz@partshub.kz"
                  className="font-medium text-ink hover:text-brand-700"
                >
                  zakaz@partshub.kz
                </a>
              </dd>
            </div>
          </dl>
          <Link
            href="/feedback"
            className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-brand hover:text-brand-700"
          >
            Написать в обратную связь
            <Icon name="arrowRight" className="size-3.5" />
          </Link>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-card border border-line bg-surface p-4 text-center shadow-card"
          >
            <p className="text-2xl font-extrabold tracking-tight text-brand">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-muted">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-lg font-bold text-ink sm:text-xl">Почему PartsHub</h2>
        <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
          {advantages.map((item) => (
            <div
              key={item.title}
              className="rounded-card border border-line bg-surface p-4 shadow-card"
            >
              <span className="flex size-10 items-center justify-center rounded-control bg-tint text-icon">
                <Icon name={item.icon} className="size-5" />
              </span>
              <h3 className="mt-3 text-sm font-bold text-ink">{item.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      <section id="requisites" className="mt-8 scroll-mt-32">
        <h2 className="text-lg font-bold text-ink sm:text-xl">Реквизиты</h2>
        <div className="mt-3 rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
          <dl className="grid gap-x-8 gap-y-2.5 text-sm sm:grid-cols-2">
            {requisites.map((item) => (
              <div
                key={item.label}
                className="flex items-start justify-between gap-3 border-b border-line/70 pb-2.5 last:border-0"
              >
                <dt className="text-muted">{item.label}</dt>
                <dd className="text-right font-medium text-ink">
                  {item.value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="mt-3 text-[11px] text-muted">
            Реквизиты демонстрационные и не относятся к реальной организации.
          </p>
        </div>
      </section>

      <section id="contacts" className="mt-8 scroll-mt-32">
        <div className="flex flex-col gap-3 rounded-card border border-line bg-tint/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h2 className="text-sm font-bold text-ink">Контакты</h2>
            <p className="mt-1 text-xs text-muted">
              Тараз, ул. Жибек Жолы, 12 · ежедневно 9:00–20:00 ·{" "}
              <a href="tel:+77000000000" className="font-medium text-ink">
                +7 (700) 000-00-00
              </a>
            </p>
          </div>
          <ButtonLink href="/feedback" variant="primary">
            Написать нам
          </ButtonLink>
        </div>
      </section>
    </Container>
  );
}
