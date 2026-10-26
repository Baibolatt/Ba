import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { CarSelector } from "@/components/catalog/car-selector";
import { CategoryTile } from "@/components/catalog/category-tile";
import { ProductCard } from "@/components/catalog/product-card";
import { BrandStrip } from "@/components/catalog/brand-strip";
import { SectionHeading } from "@/components/ui/section-heading";
import { ButtonLink } from "@/components/ui/button";
import { Icon, type IconName } from "@/components/ui/icon";
import { getCategories, getProducts } from "@/lib/data";

export const metadata: Metadata = {
  title: "Оптовые автозапчасти со склада",
};

const advantages: Array<{ icon: IconName; title: string; text: string }> = [
  {
    icon: "box",
    title: "Отгрузка со склада",
    text: "Ходовые позиции в наличии — отгружаем в день заявки.",
  },
  {
    icon: "truck",
    title: "Оптовые поставки",
    text: "Работаем с автосервисами, магазинами и автопарками.",
  },
  {
    icon: "fileText",
    title: "Документы для юрлиц",
    text: "Счёт, накладные и закрывающие документы для бухгалтерии.",
  },
];

export default async function HomePage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);
  const popular = products.filter((product) => product.badge).slice(0, 4);

  return (
    <div className="pb-8">
      <Container className="pt-4 sm:pt-6">
        <section className="relative overflow-hidden rounded-[22px] bg-ink px-4 py-5 text-white sm:px-8 sm:py-9 lg:px-10 lg:py-12">
          <div
            className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full border border-white/10"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute -bottom-24 right-16 size-56 rounded-full bg-white/10 blur-2xl"
            aria-hidden="true"
          />

          <div className="relative grid gap-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-white/80">
                <span className="size-1.5 rounded-full bg-white/70" />
                Оптовый склад автозапчастей в Таразе
              </p>
              <h1 className="mt-3 text-2xl font-extrabold leading-tight tracking-tight sm:mt-4 sm:text-4xl lg:text-[42px]">
                Оптовые запчасти,
                <br className="hidden sm:block" /> которые уже на складе
              </h1>
              <p className="mt-2.5 max-w-lg text-sm leading-relaxed text-white/75 sm:mt-3 sm:text-base">
                Поставляем автозапчасти автосервисам, магазинам и автопаркам.
                Работаем только с юридическими лицами и оптовыми покупателями —
                розничной продажи нет.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 sm:mt-5 sm:gap-2.5">
                <ButtonLink href="/catalog" variant="accent" size="lg">
                  Перейти в каталог
                  <Icon name="arrowRight" className="size-4" />
                </ButtonLink>
                <Link
                  href="/for-customers"
                  className="inline-flex h-11 items-center gap-1.5 px-1 text-sm font-semibold text-white underline-offset-4 transition-colors hover:text-white/80 hover:underline sm:h-12 sm:px-2"
                >
                  Условия работы
                </Link>
              </div>
              <div className="mt-4 hidden flex-wrap items-center gap-x-5 gap-y-2 text-xs text-white/70 sm:mt-5 sm:flex">
                <span className="flex items-center gap-1.5">
                  <Icon name="check" className="size-3.5 text-white/70" />
                  Оптовые цены
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon name="check" className="size-3.5 text-white/70" />
                  Документы для юрлиц
                </span>
                <span className="flex items-center gap-1.5">
                  <Icon name="check" className="size-3.5 text-white/70" />
                  Самовывоз со склада
                </span>
              </div>
            </div>

            <div className="hidden lg:block">
              <CarSelector />
            </div>
          </div>
        </section>

        <div className="mt-3 lg:hidden">
          <CarSelector />
        </div>
      </Container>

      <Container className="mt-3">
        <div className="flex items-start gap-2.5 rounded-card border border-brand/20 bg-brand-50 px-4 py-3 text-sm text-brand">
          <Icon name="fileText" className="mt-0.5 size-4 shrink-0" />
          <p>
            <span className="font-bold">Только оптовые продажи.</span> Работаем
            с юридическими лицами и оптовыми покупателями, розничной продажи
            нет.
          </p>
        </div>
      </Container>

      <Container className="mt-8 sm:mt-10">
        <SectionHeading
          title="Категории"
          description="Найдите нужный раздел каталога"
          action={
            <Link
              href="/catalog"
              className="flex items-center gap-1 text-sm font-semibold text-brand transition-colors hover:text-brand-700"
            >
              Весь каталог
              <Icon name="chevronRight" className="size-4" />
            </Link>
          }
        />
        <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryTile
              key={category.slug}
              category={category}
              count={category.productCount}
            />
          ))}
        </div>
      </Container>

      <Container className="mt-8 sm:mt-10">
        <SectionHeading
          title="Хиты склада"
          description="Позиции, которые чаще всего заказывают"
          action={
            <Link
              href="/catalog/all"
              className="flex items-center gap-1 text-sm font-semibold text-brand transition-colors hover:text-brand-700"
            >
              Все товары
              <Icon name="chevronRight" className="size-4" />
            </Link>
          }
        />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {popular.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </Container>

      <Container className="mt-8 sm:mt-10">
        <div className="grid gap-3 sm:grid-cols-3">
          {advantages.map((item) => (
            <div
              key={item.title}
              className="flex gap-3 rounded-card border border-line bg-surface p-4 shadow-card"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-tint text-icon">
                <Icon name={item.icon} className="size-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold text-ink">{item.title}</h2>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Container>

      <Container className="mt-8 sm:mt-10">
        <SectionHeading
          title="Бренды"
          description="Вымышленные бренды для демонстрации каталога"
        />
        <div className="mt-4">
          <BrandStrip />
        </div>
      </Container>

      <Container className="mt-8 sm:mt-10">
        <div className="flex flex-col gap-4 rounded-card border border-line bg-tint/60 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-ink text-white">
              <Icon name="wrench" className="size-5" />
            </span>
            <div>
              <h2 className="text-base font-bold text-ink">
                Не нашли нужную деталь?
              </h2>
              <p className="mt-1 text-sm text-muted">
                Напишите артикул — проверим наличие на складе и предложим
                аналог.
              </p>
            </div>
          </div>
          <ButtonLink href="/feedback" variant="primary" className="shrink-0">
            Написать нам
          </ButtonLink>
        </div>
      </Container>
    </div>
  );
}
