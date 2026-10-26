import type { Metadata } from "next";
import Link from "next/link";
import { ProductStockForm } from "@/components/admin/product-stock-form";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { fieldControlClass } from "@/components/ui/form-fields";
import { Icon } from "@/components/ui/icon";
import { ProductImage } from "@/components/catalog/product-image";
import { StockBadge } from "@/components/ui/stock-badge";
import { requireAdmin } from "@/lib/admin-auth";
import { getProducts } from "@/lib/data";
import { formatPrice, stockLevel } from "@/lib/format";

export const metadata: Metadata = {
  title: "Товары",
};

type ProductsPageProps = {
  searchParams: Promise<{
    q?: string | string[];
    stock?: string | string[];
  }>;
};

const stockTabs = [
  { value: "all", label: "Все" },
  { value: "in", label: "В наличии" },
  { value: "low", label: "Заканчиваются" },
  { value: "out", label: "Нет в наличии" },
] as const;

type StockFilter = (typeof stockTabs)[number]["value"];

function single(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

function normalizeStock(value: string): StockFilter {
  return stockTabs.some((tab) => tab.value === value)
    ? (value as StockFilter)
    : "all";
}

function productsHref(stock: StockFilter, query: string): string {
  const params = new URLSearchParams();
  if (stock !== "all") params.set("stock", stock);
  if (query) params.set("q", query);
  const search = params.toString();
  return search ? `/admin/products?${search}` : "/admin/products";
}

export default async function AdminProductsPage({
  searchParams,
}: ProductsPageProps) {
  await requireAdmin();

  const [products, params] = await Promise.all([
    getProducts(),
    searchParams,
  ]);

  const stock = normalizeStock(single(params.stock));
  const query = single(params.q).trim();
  const needle = query.toLowerCase();

  const counts: Record<StockFilter, number> = {
    all: products.length,
    in: products.filter((product) => stockLevel(product) === "in").length,
    low: products.filter((product) => stockLevel(product) === "low").length,
    out: products.filter((product) => stockLevel(product) === "out").length,
  };

  const filtered = products.filter((product) => {
    const level = stockLevel(product);
    if (stock !== "all" && level !== stock) return false;
    if (!needle) return true;

    return [product.article, product.name, product.brand, product.categoryName]
      .join(" ")
      .toLowerCase()
      .includes(needle);
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-ink">Товары</h2>
          <p className="mt-0.5 text-sm text-muted">
            Найдено {filtered.length} из {products.length}. Цену и остаток
            можно менять прямо в списке.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/admin/products/new" size="sm">
            <Icon name="plus" className="size-4" />
            Добавить
          </ButtonLink>
          <ButtonLink href="/admin/import" variant="secondary" size="sm">
            <Icon name="fileText" className="size-4" />
            Импорт
          </ButtonLink>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 rounded-card border border-line bg-surface p-1.5 shadow-card">
        {stockTabs.map((tab) => {
          const active = tab.value === stock;
          return (
            <Link
              key={tab.value}
              href={productsHref(tab.value, query)}
              aria-current={active ? "page" : undefined}
              className={[
                "flex min-h-10 shrink-0 items-center gap-1.5 rounded-control px-3 py-2 text-xs font-semibold transition-colors",
                active
                  ? "bg-brand text-white"
                  : "text-muted hover:bg-brand-50 hover:text-ink",
              ].join(" ")}
            >
              {tab.label}
              <span
                className={[
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                  active ? "bg-white/20 text-white" : "bg-page text-muted",
                ].join(" ")}
              >
                {counts[tab.value]}
              </span>
            </Link>
          );
        })}
      </div>

      <form
        method="get"
        action="/admin/products"
        className="flex flex-wrap items-center gap-2 rounded-card border border-line bg-surface p-3 shadow-card"
      >
        {stock !== "all" ? (
          <input type="hidden" name="stock" value={stock} />
        ) : null}
        <label className="relative min-w-0 flex-1 basis-48">
          <span className="sr-only">Поиск по товарам</span>
          <Icon
            name="search"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Артикул, название, бренд или категория"
            className={`${fieldControlClass(false)} h-11 pl-9`}
          />
        </label>
        <div className="flex gap-2">
          <Button type="submit" size="sm" className="flex-1 sm:flex-none">
            Найти
          </Button>
          {query || stock !== "all" ? (
            <ButtonLink
              href="/admin/products"
              variant="secondary"
              size="sm"
              className="flex-1 sm:flex-none"
            >
              Сбросить
            </ButtonLink>
          ) : null}
        </div>
      </form>

      {filtered.length === 0 ? (
        <EmptyState
          icon="listView"
          title={
            products.length === 0 ? "Товаров пока нет" : "Ничего не найдено"
          }
          description={
            products.length === 0
              ? "Добавьте первый товар или загрузите прайс-лист."
              : "Измените запрос или сбросьте фильтры."
          }
          action={
            products.length === 0 ? (
              <ButtonLink href="/admin/products/new">
                Добавить товар
              </ButtonLink>
            ) : (
              <ButtonLink href="/admin/products" variant="secondary">
                Показать все товары
              </ButtonLink>
            )
          }
        />
      ) : (
        <ul className="space-y-2.5">
          {filtered.map((product) => (
            <li
              key={product.id}
              className="rounded-card border border-line bg-surface p-3 shadow-card sm:p-4"
            >
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <Link
                  href={`/admin/products/${product.id}`}
                  className="flex min-w-0 items-center gap-3 rounded-control transition-colors hover:bg-brand-50/40"
                >
                  <ProductImage
                    product={product}
                    className="size-16 shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-ink">
                        {product.name}
                      </p>
                      <StockBadge
                        level={stockLevel(product)}
                        stock={product.quantity}
                      />
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      {product.article} · {product.brand} ·{" "}
                      {product.categoryName}
                    </p>
                    <p className="mt-1 text-sm font-bold text-brand">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                </Link>

                <div className="flex flex-col items-stretch gap-2 border-t border-line pt-3 lg:flex-row lg:items-center lg:border-0 lg:pt-0">
                  <ProductStockForm
                    productId={product.id}
                    price={product.price}
                    quantity={product.quantity}
                  />
                  <ButtonLink
                    href={`/admin/products/${product.id}`}
                    variant="secondary"
                    size="sm"
                    className="justify-center"
                  >
                    Изменить
                  </ButtonLink>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
