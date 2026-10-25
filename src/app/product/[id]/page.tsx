import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { StockBadge } from "@/components/ui/stock-badge";
import { SectionHeading } from "@/components/ui/section-heading";
import { ProductImage } from "@/components/catalog/product-image";
import { ProductPurchase } from "@/components/catalog/product-purchase";
import { ProductCard } from "@/components/catalog/product-card";
import { Icon } from "@/components/ui/icon";
import {
  formatPrice,
  getCategory,
  getProduct,
  getRelatedProducts,
  products,
  stockLevel,
} from "@/lib/mock-data";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return products.map((product) => ({ id: product.id }));
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { id } = await params;
  const product = getProduct(id);

  if (!product) return { title: "Товар не найден" };

  return {
    title: product.name,
    description: `${product.name} (${product.brand}, арт. ${product.article}) — наличие и цена на складе PartsHub.`,
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const product = getProduct(id);

  if (!product) notFound();

  const category = getCategory(product.categorySlug);
  const level = stockLevel(product);
  const related = getRelatedProducts(product);
  const discount = product.oldPrice
    ? Math.round((1 - product.price / product.oldPrice) * 100)
    : null;

  return (
    <Container className="py-5 sm:py-8">
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Каталог", href: "/catalog" },
          ...(category
            ? [{ label: category.name, href: `/catalog/${category.slug}` }]
            : []),
          { label: product.name },
        ]}
      />

      <div className="mt-5 grid gap-6 lg:grid-cols-2 lg:gap-10">
        <div>
          <ProductImage product={product} className="aspect-square w-full" />
          <div className="mt-2.5 grid grid-cols-3 gap-2.5">
            {[0, 1, 2].map((index) => (
              <ProductImage
                key={index}
                product={product}
                className={
                  index === 0
                    ? "aspect-square ring-2 ring-brand"
                    : "aspect-square opacity-80"
                }
              />
            ))}
          </div>
          <p className="mt-2 text-[11px] text-muted">
            Изображения — заглушки для демонстрации раскладки.
          </p>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-brand">
              {product.brand}
            </span>
            <StockBadge level={level} stock={product.stock} />
          </div>

          <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-ink sm:text-3xl">
            {product.name}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Артикул: <span className="font-mono text-ink">{product.article}</span>
            {category ? (
              <>
                {" · "}
                <Link
                  href={`/catalog/${category.slug}`}
                  className="transition-colors hover:text-ink"
                >
                  {category.name}
                </Link>
              </>
            ) : null}
          </p>

          <div className="mt-5 rounded-card border border-line bg-surface p-4 shadow-card">
            <div className="flex flex-wrap items-end gap-3">
              <p className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
                {formatPrice(product.price)}
              </p>
              {product.oldPrice ? (
                <p className="pb-1 text-sm text-muted line-through">
                  {formatPrice(product.oldPrice)}
                </p>
              ) : null}
              {discount ? (
                <span className="mb-1 rounded-full bg-tint px-2 py-0.5 text-xs font-bold text-brand">
                  −{discount}%
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-xs text-muted">Цена за {product.unit}</p>

            <div className="mt-4">
              <ProductPurchase product={product} />
            </div>
          </div>

          <ul className="mt-4 space-y-2.5">
            <li className="flex items-start gap-2.5 text-sm text-muted">
              <Icon name="box" className="mt-0.5 size-4 shrink-0 text-icon" />
              <span>
                <span className="font-medium text-ink">Со склада.</span>{" "}
                Самовывоз сегодня после подтверждения заказа.
              </span>
            </li>
            <li className="flex items-start gap-2.5 text-sm text-muted">
              <Icon name="shield" className="mt-0.5 size-4 shrink-0 text-icon" />
              <span>
                <span className="font-medium text-ink">Гарантия 12 месяцев</span>{" "}
                на товар и документы при получении.
              </span>
            </li>
            <li className="flex items-start gap-2.5 text-sm text-muted">
              <Icon
                name="rotateCcw"
                className="mt-0.5 size-4 shrink-0 text-icon"
              />
              <span>
                <span className="font-medium text-ink">Возврат 14 дней</span>,
                если деталь не подошла.
              </span>
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-8 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
          <h2 className="text-base font-bold text-ink">Характеристики</h2>
          <dl className="mt-3 divide-y divide-line text-sm">
            {product.specs.map((spec) => (
              <div
                key={spec.label}
                className="flex items-start justify-between gap-4 py-2.5"
              >
                <dt className="text-muted">{spec.label}</dt>
                <dd className="text-right font-medium text-ink">
                  {spec.value}
                </dd>
              </div>
            ))}
            <div className="flex items-start justify-between gap-4 py-2.5">
              <dt className="text-muted">Артикул</dt>
              <dd className="text-right font-mono font-medium text-ink">
                {product.article}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
          <h2 className="text-base font-bold text-ink">Описание</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {product.description}
          </p>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            Товар хранится на складе в Таразе. Наличие на странице обновляется
            по данным склада; перед крупным заказом уточните количество у
            менеджера.
          </p>
          <Link
            href="/feedback"
            className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand transition-colors hover:text-brand-700"
          >
            Уточнить у менеджера
            <Icon name="arrowRight" className="size-4" />
          </Link>
        </section>
      </div>

      {related.length > 0 ? (
        <div className="mt-8">
          <SectionHeading
            title="Похожие товары"
            description="Из той же категории или от того же бренда"
            action={
              category ? (
                <Link
                  href={`/catalog/${category.slug}`}
                  className="flex items-center gap-1 text-sm font-semibold text-brand transition-colors hover:text-brand-700"
                >
                  В категорию
                  <Icon name="chevronRight" className="size-4" />
                </Link>
              ) : null
            }
          />
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      ) : null}
    </Container>
  );
}
