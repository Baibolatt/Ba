"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { stockLevel, type Product } from "@/lib/mock-data";
import { ProductCard } from "@/components/catalog/product-card";
import { ProductTable } from "@/components/catalog/product-table";
import {
  activeFiltersCount,
  emptyFilters,
  FilterSheet,
  FilterSidebar,
  FiltersPanel,
  type FiltersValue,
} from "@/components/catalog/filters";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { Pagination } from "@/components/ui/pagination";

type SortKey = "popular" | "price-asc" | "price-desc" | "name";
type ViewMode = "grid" | "table";

const PAGE_SIZE = 8;

const sortOptions: Array<{ value: SortKey; label: string }> = [
  { value: "popular", label: "Сначала популярные" },
  { value: "price-asc", label: "Сначала дешёвые" },
  { value: "price-desc", label: "Сначала дорогие" },
  { value: "name", label: "По названию" },
];

type CatalogViewProps = {
  products: Product[];
  emptyTitle?: string;
};

export function CatalogView({
  products,
  emptyTitle = "Ничего не найдено",
}: CatalogViewProps) {
  const [view, setView] = useState<ViewMode>("grid");
  const [sort, setSort] = useState<SortKey>("popular");
  const [filters, setFilters] = useState<FiltersValue>(emptyFilters);
  const [page, setPage] = useState(1);
  const [sheetOpen, setSheetOpen] = useState(false);

  const brandOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const product of products) {
      counts.set(product.brand, (counts.get(product.brand) ?? 0) + 1);
    }
    return Array.from(counts, ([name, count]) => ({ name, count })).sort(
      (a, b) => a.name.localeCompare(b.name, "ru"),
    );
  }, [products]);

  const filtered = useMemo(() => {
    const min = filters.minPrice ? Number(filters.minPrice) : null;
    const max = filters.maxPrice ? Number(filters.maxPrice) : null;

    const result = products.filter((product) => {
      if (filters.brands.length && !filters.brands.includes(product.brand)) {
        return false;
      }
      if (min !== null && product.price < min) return false;
      if (max !== null && product.price > max) return false;
      if (filters.inStockOnly && stockLevel(product) === "out") return false;
      return true;
    });

    const sorted = [...result];
    if (sort === "price-asc") sorted.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") sorted.sort((a, b) => b.price - a.price);
    if (sort === "name") {
      sorted.sort((a, b) => a.name.localeCompare(b.name, "ru"));
    }
    return sorted;
  }, [products, filters, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages);
  const visible = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const activeCount = activeFiltersCount(filters);

  const handleFilters = (next: FiltersValue) => {
    setFilters(next);
    setPage(1);
  };

  const resetFilters = () => {
    setFilters(emptyFilters);
    setPage(1);
  };

  return (
    <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6">
      <FilterSidebar
        brands={brandOptions}
        value={filters}
        onChange={handleFilters}
        onReset={resetFilters}
      />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-card border border-line bg-surface px-3 py-2.5 shadow-card sm:px-4">
          <p className="text-xs text-muted sm:text-sm">
            Найдено{" "}
            <span className="font-semibold text-ink">{filtered.length}</span>{" "}
            {filtered.length === 1 ? "товар" : "товаров"}
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-control border border-line-strong bg-surface px-3 text-xs font-semibold text-ink lg:hidden"
            >
              <Icon name="filter" className="size-3.5" />
              Фильтры
              {activeCount > 0 ? (
                <span className="flex size-4 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-brand">
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
              onChange={(event) => {
                setSort(event.target.value as SortKey);
                setPage(1);
              }}
              className="h-9 rounded-control border border-line-strong bg-surface pl-3 pr-7 text-xs font-medium text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-accent/25"
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
                onClick={() => setView("grid")}
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
                onClick={() => setView("table")}
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
                  handleFilters({
                    ...filters,
                    brands: filters.brands.filter((item) => item !== brand),
                  })
                }
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand"
              >
                {brand}
                <Icon name="close" className="size-3" />
              </button>
            ))}
            {filters.minPrice || filters.maxPrice ? (
              <button
                type="button"
                onClick={() =>
                  handleFilters({ ...filters, minPrice: "", maxPrice: "" })
                }
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand"
              >
                Цена {filters.minPrice || "0"}—{filters.maxPrice || "∞"}
                <Icon name="close" className="size-3" />
              </button>
            ) : null}
            {filters.inStockOnly ? (
              <button
                type="button"
                onClick={() =>
                  handleFilters({ ...filters, inStockOnly: false })
                }
                className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand"
              >
                В наличии
                <Icon name="close" className="size-3" />
              </button>
            ) : null}
          </div>
        ) : null}

        {visible.length === 0 ? (
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
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {visible.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <ProductTable products={visible} />
          </div>
        )}

        <div className="mt-6">
          <Pagination
            page={currentPage}
            pages={pages}
            onPageChange={setPage}
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
            Показать {filtered.length}
          </Button>
        }
      >
        <FiltersPanel
          brands={brandOptions}
          value={filters}
          onChange={handleFilters}
          onReset={resetFilters}
        />
      </FilterSheet>
    </div>
  );
}
