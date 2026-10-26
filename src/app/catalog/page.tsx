import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CarSelector } from "@/components/catalog/car-selector";
import { CategoryTile } from "@/components/catalog/category-tile";
import { ProductCard } from "@/components/catalog/product-card";
import { BrandStrip } from "@/components/catalog/brand-strip";
import { SectionHeading } from "@/components/ui/section-heading";
import { Icon } from "@/components/ui/icon";
import { getCategories, getProducts } from "@/lib/data";
import { productCountLabel } from "@/lib/format";

export const metadata: Metadata = {
  title: "Каталог запчастей",
  description:
    "Категории автозапчастей PartsHub: тормозная система, фильтры, масла, двигатель, подвеска и электрика.",
};

export default async function CatalogPage() {
  const [categories, products] = await Promise.all([
    getCategories(),
    getProducts(),
  ]);
  const popular = products.slice(0, 4);

  return (
    <Container className="py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Каталог" }]} />

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Каталог запчастей
          </h1>
          <p className="mt-1.5 max-w-2xl text-sm text-muted">
            {productCountLabel(products.length)} в наличии и под заказ. Выберите
            категорию или воспользуйтесь подбором по автомобилю.
          </p>
        </div>
        <Link
          href="/catalog/all"
          className="flex items-center gap-1 text-sm font-semibold text-brand transition-colors hover:text-brand-700"
        >
          Показать все товары
          <Icon name="arrowRight" className="size-4" />
        </Link>
      </div>

      <div className="mt-5">
        <CarSelector />
      </div>

      <div className="mt-7">
        <SectionHeading
          title="Категории"
          description="Выберите раздел — внутри работают фильтры и вид таблицей"
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
      </div>

      <div className="mt-8">
        <SectionHeading
          title="Популярное"
          description="Частые позиции со склада"
          action={
            <Link
              href="/catalog/all"
              className="flex items-center gap-1 text-sm font-semibold text-brand transition-colors hover:text-brand-700"
            >
              Смотреть все
              <Icon name="chevronRight" className="size-4" />
            </Link>
          }
        />
        <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {popular.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>

      <div className="mt-8">
        <SectionHeading
          title="Бренды"
          description="Нажмите на бренд, чтобы увидеть его товары"
        />
        <div className="mt-4">
          <BrandStrip />
        </div>
      </div>

      <div className="mt-8 flex items-start gap-3 rounded-card border border-line bg-surface p-4 shadow-card">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-tint text-icon">
          <Icon name="truck" className="size-5" />
        </span>
        <div>
          <h2 className="text-sm font-bold text-ink">Только опт</h2>
          <p className="mt-1 text-xs leading-relaxed text-muted">
            Наличие обновляется по данным склада. Отгрузка со склада или
            доставка по области после подтверждения заявки.
          </p>
        </div>
      </div>
    </Container>
  );
}
