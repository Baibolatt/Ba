import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CarSelector } from "@/components/catalog/car-selector";
import { CatalogView } from "@/components/catalog/catalog-view";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/cn";
import {
  getCategories,
  getCategory,
  getProductsByCategory,
} from "@/lib/data";
import { productCountLabel } from "@/lib/format";

type CategoryPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const categories = await getCategories();

  return [
    { slug: "all" },
    ...categories.map((category) => ({ slug: category.slug })),
  ];
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;

  if (slug === "all") {
    return {
      title: "Все товары",
      description: "Полный каталог автозапчастей PartsHub со склада.",
    };
  }

  const category = await getCategory(slug);
  if (!category) return { title: "Категория не найдена" };

  return {
    title: category.name,
    description: `${category.name}: ${category.description}. Наличие и цены на складе PartsHub.`,
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;

  const [categories, category, items] = await Promise.all([
    getCategories(),
    slug === "all" ? Promise.resolve(null) : getCategory(slug),
    getProductsByCategory(slug),
  ]);

  if (slug !== "all" && !category) {
    notFound();
  }

  const title = category?.name ?? "Все товары";
  const description =
    category?.description ??
    "Полный список позиций склада с фильтрами и переключением вида.";

  return (
    <Container className="py-5 sm:py-8">
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Каталог", href: "/catalog" },
          { label: title },
        ]}
      />

      <div className="mt-4 flex items-start gap-3">
        <span className="hidden size-12 shrink-0 items-center justify-center rounded-card bg-tint text-icon sm:flex">
          <Icon name={category?.icon ?? "grid"} className="size-6" />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {description} · {productCountLabel(items.length)}
          </p>
        </div>
      </div>

      <div className="mt-5">
        <CarSelector />
      </div>

      <div className="mt-4">
        <div className="flex flex-wrap gap-2">
          <Link
            href="/catalog/all"
            className={cn(
              "inline-flex min-h-11 items-center rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors",
              slug === "all"
                ? "border-brand bg-brand text-white"
                : "border-line bg-surface text-muted hover:border-brand/40 hover:text-ink",
            )}
          >
            Все товары
          </Link>
          {categories.map((item) => (
            <Link
              key={item.slug}
              href={`/catalog/${item.slug}`}
              className={cn(
                "inline-flex min-h-11 items-center rounded-full border px-3.5 py-2 text-xs font-semibold transition-colors",
                slug === item.slug
                  ? "border-brand bg-brand text-white"
                  : "border-line bg-surface text-muted hover:border-brand/40 hover:text-ink",
              )}
            >
              {item.shortName}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-5">
        <CatalogView
          products={items}
          emptyTitle={
            slug === "all"
              ? "В каталоге пока нет подходящих товаров"
              : "В этой категории ничего не нашлось"
          }
        />
      </div>
    </Container>
  );
}
