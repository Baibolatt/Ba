"use client";

import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  catalogFiltersKey,
  catalogHref,
  type CatalogFilters,
  type CatalogSort,
  type CatalogViewMode,
} from "@/lib/catalog-query";
import type { Product } from "@/lib/types";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductTable } from "@/components/catalog/product-table";
import {
  activeFiltersCount,
  FilterSheet,
  FilterSidebar,
  FiltersPanel,
  type FiltersValue,
} from "@/components/catalog/filters";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Pagination } from "@/components/ui/pagination";

const sortOptions: Array<{ value: CatalogSort; label: string }> = [
  { value: "popular", label: "Сначала популярные" },
  { value: "price-asc", label: "Сначала дешёвые" },
  { value: "price-desc", label: "Сначала дорогие" },
  { value: "name", label: "По названию" },
];

type BrandFacet = {
  name: string;
  count: number;
};

type CatalogViewProps = {
  products: Product[];
  total: number;
  page: number;
  pages: number;
  brands: BrandFacet[];
  filters: CatalogFilters;
  sort: CatalogSort;
  view: CatalogViewMode;
  emptyTitle?: string;
};

function priceToNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  return Number(trimmed);
}

function toFiltersValue(filters: CatalogFilters): FiltersValue {
  return {
    brands: filters.brands,
    minPrice: filters.minPrice === null ? "" : String(filters.minPrice),
    maxPrice: filters.maxPrice === null ? "" : String(filters.maxPrice),
    inStockOnly: filters.inStockOnly,
  };
}

export function CatalogView({
  products,
  total,
  page,
  pages,
  brands,
  filters,
  sort,
  view,
  emptyTitle = "Ничего не найдено",
}: CatalogViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  const filtersValue = toFiltersValue(filters);
  const activeCount = activeFiltersCount(filtersValue);
  const filtersKey = catalogFiltersKey(filters);

  const applyQuery = (
    next: Partial<{
      filters: CatalogFilters;
      sort: CatalogSort;
      view: CatalogViewMode;
      page: number;
    }>,
    scroll = false,
  ) => {
    router.push(
      catalogHref(pathname, {
        filters,
        sort,
        view,
        page,
        ...next,
      }),
      { scroll },
    );
  };

  const commitFilters = (value: FiltersValue) => {
    let minPrice = priceToNumber(value.minPrice);
    let maxPrice = priceToNumber(value.maxPrice);

    if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
      [minPrice, maxPrice] = [maxPrice, minPrice];
    }

    applyQuery({
      filters: {
        brands: value.brands,
        minPrice,
        maxPrice,
        inStockOnly: value.inStockOnly,
      },
      page: 1,
    });
  };

  const resetFilters = () => {
    applyQuery({
      filters: {
        brands: [],
        minPrice: null,
        maxPrice: null,
        inStockOnly: false,
      },
      page: 1,
    });
  };

  return (
    <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6">
      <FilterSidebar
        key={`sidebar-${filtersKey}`}
        brands={brands}
        value={filtersValue}
        onChange={commitFilters}
        onReset={resetFilters}
      />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface px-3 py-2.5 shadow-card sm:px-4">
          <p className="text-xs text-muted sm:text-sm">
            Найдено <span className="font-semibold text-ink">{total}</span>{" "}
            {total === 1 ? "товар" : "товаров"}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="inline-flex h-11 items-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 text-xs font-semibold text-ink lg:hidden"
            >
              <Icon name="filter" className="size-3.5" />
              Фильтры
              {activeCount > 0 ? (
                <span className="flex size-4 items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white">
                  {activeCount}
                </span>
              ) : null}
            </button>

            <label className="sr-only" htmlFor="catalog-sort">
              Сортировка
            </label>
            <select
              id="catalog-sort"
              value={sort}
              onChange={(event) =>
                applyQuery({
                  sort: event.target.value as CatalogSort,
                  page: 1,
                })
              }
              className="h-11 rounded-control border border-line-strong bg-surface pl-3 pr-7 text-xs font-medium text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <div className="hidden items-center rounded-control border border-line-strong bg-surface p-0.5 sm:flex">
              <button
                type="button"
                onClick={() => applyQuery({ view: "grid" })}
                aria-label="Показать карточками"
                aria-pressed={view === "grid"}
                className={cn(
                  "flex size-8 items-center justify-center rounded-[7px] transition-colors",
                  view === "grid"
                    ? "bg-brand text-white"
                    : "text-muted hover:text-ink",
                )}
              >
                <Icon name="gridView" className="size-4" />
              </button>
              <button
                type="button"
                onClick={() => applyQuery({ view: "table" })}
                aria-label="Показать таблицей"
                aria-pressed={view === "table"}
                className={cn(
                  "flex size-8 items-center justify-center rounded-[7px] transition-colors",
                  view === "table"
                    ? "bg-brand text-white"
                    : "text-muted hover:text-ink",
                )}
              >
                <Icon name="listView" className="size-4" />
              </button>
            </div>
          </div>
        </div>

        {activeCount > 0 ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {filters.brands.map((brand) => (
              <button
                key={brand}
                type="button"
                onClick={() =>
                  applyQuery({
                    filters: {
                      ...filters,
                      brands: filters.brands.filter((item) => item !== brand),
                    },
                    page: 1,
                  })
                }
                className="inline-flex min-h-11 items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand"
              >
                {brand}
                <Icon name="close" className="size-3" />
              </button>
            ))}
            {filters.minPrice !== null || filters.maxPrice !== null ? (
              <button
                type="button"
                onClick={() =>
                  applyQuery({
                    filters: {
                      ...filters,
                      minPrice: null,
                      maxPrice: null,
                    },
                    page: 1,
                  })
                }
                className="inline-flex min-h-11 items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand"
              >
                Цена {filters.minPrice ?? "0"}—{filters.maxPrice ?? "∞"}
                <Icon name="close" className="size-3" />
              </button>
            ) : null}
            {filters.inStockOnly ? (
              <button
                type="button"
                onClick={() =>
                  applyQuery({
                    filters: { ...filters, inStockOnly: false },
                    page: 1,
                  })
                }
                className="inline-flex min-h-11 items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand"
              >
                В наличии
                <Icon name="close" className="size-3" />
              </button>
            ) : null}
          </div>
        ) : null}

        {products.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              icon="search"
              title={emptyTitle}
              description="Попробуйте изменить фильтры или сбросить их — в каталоге есть другие позиции."
              action={
                <Button variant="secondary" onClick={resetFilters}>
                  Сбросить фильтры
                </Button>
              }
            />
          </div>
        ) : view === "grid" ? (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-4">
            {/* На мобильных таблица заменяется карточками: без горизонтального скролла. */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:hidden">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
            <div className="hidden lg:block">
              <ProductTable products={products} />
            </div>
          </div>
        )}

        <div className="mt-6">
          <Pagination
            page={page}
            pages={pages}
            onPageChange={(nextPage) => applyQuery({ page: nextPage }, true)}
          />
        </div>
      </div>

      <FilterSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        footer={
          <Button
            variant="primary"
            className="w-full"
            onClick={() => setSheetOpen(false)}
          >
            Показать {total}
          </Button>
        }
      >
        <FiltersPanel
          key={`sheet-${filtersKey}`}
          brands={brands}
          value={filtersValue}
          onChange={commitFilters}
          onReset={resetFilters}
        />
      </FilterSheet>
    </div>
  );
}
