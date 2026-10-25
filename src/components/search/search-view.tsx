"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { searchProducts } from "@/lib/mock-data";
import { ProductCard } from "@/components/catalog/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

const quickQueries = [
  { label: "Колодки", query: "колодки" },
  { label: "Фильтр", query: "фильтр" },
  { label: "Масло", query: "масло" },
  { label: "Аккумулятор", query: "аккумулятор" },
  { label: "Свечи", query: "свеча" },
];

export function SearchView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = searchParams.get("q")?.trim() ?? "";
  const [query, setQuery] = useState(q);

  useEffect(() => {
    setQuery(q);
  }, [q]);

  const results = searchProducts(q);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
  };

  return (
    <div>
      <form onSubmit={onSubmit} className="mt-4">
        <div className="relative">
          <Icon
            name="search"
            className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Введите артикул, название или бренд"
            aria-label="Поисковый запрос"
            className="h-12 w-full rounded-control border border-line-strong bg-surface pl-11 pr-28 text-sm text-ink placeholder:text-muted/80 focus:border-brand focus:outline-none focus:ring-2 focus:ring-accent/25"
          />
          <Button
            type="submit"
            variant="accent"
            className="absolute right-1.5 top-1.5 h-9 px-4 text-xs"
          >
            Найти
          </Button>
        </div>
      </form>

      {!q ? (
        <div className="mt-8">
          <h2 className="text-sm font-bold text-ink">Частые запросы</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {quickQueries.map((item) => (
              <Link
                key={item.query}
                href={`/search?q=${encodeURIComponent(item.query)}`}
                className="rounded-full border border-line bg-surface px-3.5 py-2 text-sm text-brand transition-colors hover:border-accent hover:bg-accent-soft/40"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="mt-6">
            <EmptyState
              icon="search"
              title="Начните с артикула или названия"
              description="Например, «TL-2418», «масляный фильтр» или «ТехноЛайн». Поиск работает по названию, артикулу и бренду."
              action={
                <Link
                  href="/catalog"
                  className="text-sm font-semibold text-brand underline-offset-4 hover:underline"
                >
                  Перейти в каталог
                </Link>
              }
            />
          </div>
        </div>
      ) : results.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon="search"
            title={`По запросу «${q}» ничего не найдено`}
            description="Проверьте написание артикула или напишите нам — проверим наличие на складе."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link
                  href="/catalog"
                  className="inline-flex h-10 items-center rounded-control bg-brand px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
                >
                  Открыть каталог
                </Link>
                <Link
                  href="/feedback"
                  className="inline-flex h-10 items-center rounded-control border border-line-strong bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-brand-50"
                >
                  Написать нам
                </Link>
              </div>
            }
          />
        </div>
      ) : (
        <div className="mt-6">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-bold text-ink">
              Результаты по запросу «{q}»
            </h2>
            <span className="text-xs text-muted">
              {results.length}{" "}
              {results.length === 1
                ? "товар"
                : results.length < 5
                  ? "товара"
                  : "товаров"}
            </span>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
