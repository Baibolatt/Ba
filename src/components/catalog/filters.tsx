"use client";

import { useEffect, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";

export type FiltersValue = {
  brands: string[];
  minPrice: string;
  maxPrice: string;
  inStockOnly: boolean;
};

export const emptyFilters: FiltersValue = {
  brands: [],
  minPrice: "",
  maxPrice: "",
  inStockOnly: false,
};

export function activeFiltersCount(filters: FiltersValue): number {
  return (
    filters.brands.length +
    (filters.minPrice || filters.maxPrice ? 1 : 0) +
    (filters.inStockOnly ? 1 : 0)
  );
}

type BrandOption = {
  name: string;
  count: number;
};

type FiltersPanelProps = {
  brands: BrandOption[];
  value: FiltersValue;
  onChange: (value: FiltersValue) => void;
  onReset: () => void;
  className?: string;
};

export function FiltersPanel({
  brands,
  value,
  onChange,
  onReset,
  className,
}: FiltersPanelProps) {
  // Цена вводится локально и применяется по Enter или потере фокуса,
  // чтобы не отправлять запрос на каждую цифру.
  const [price, setPrice] = useState({
    min: value.minPrice,
    max: value.maxPrice,
  });

  const currentValue: FiltersValue = {
    ...value,
    minPrice: price.min,
    maxPrice: price.max,
  };

  const toggleBrand = (brand: string) => {
    const selected = value.brands.includes(brand)
      ? value.brands.filter((item) => item !== brand)
      : [...value.brands, brand];
    onChange({ ...currentValue, brands: selected });
  };

  const applyPrice = () => {
    if (price.min === value.minPrice && price.max === value.maxPrice) return;
    onChange(currentValue);
  };

  const reset = () => {
    setPrice({ min: "", max: "" });
    onReset();
  };

  return (
    <div className={cn("space-y-5", className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-bold text-ink">Фильтры</h2>
        <button
          type="button"
          onClick={reset}
          className="text-xs font-medium text-muted underline-offset-2 transition-colors hover:text-brand hover:underline"
        >
          Сбросить
        </button>
      </div>

      <fieldset>
        <legend className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
          Бренд
        </legend>
        <div className="space-y-2.5">
          {brands.map((brand) => (
            <label
              key={brand.name}
              className="flex min-h-11 cursor-pointer items-center justify-between gap-2 text-sm text-ink"
            >
              <span className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={value.brands.includes(brand.name)}
                  onChange={() => toggleBrand(brand.name)}
                  className="size-4 rounded border-line-strong accent-brand"
                />
                {brand.name}
              </span>
              <span className="text-xs text-muted">{brand.count}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
          Цена, ₸
        </legend>
        <div className="flex items-center gap-2">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="От"
            aria-label="Цена от"
            value={price.min}
            onChange={(event) =>
              setPrice((current) => ({
                ...current,
                min: event.target.value,
              }))
            }
            onBlur={applyPrice}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            className="h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
          <span className="text-muted">—</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="До"
            aria-label="Цена до"
            value={price.max}
            onChange={(event) =>
              setPrice((current) => ({
                ...current,
                max: event.target.value,
              }))
            }
            onBlur={applyPrice}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            className="h-11 w-full rounded-control border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted">
          Наличие
        </legend>
        <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-sm text-ink">
          <input
            type="checkbox"
            checked={value.inStockOnly}
            onChange={(event) =>
              onChange({
                ...currentValue,
                inStockOnly: event.target.checked,
              })
            }
            className="size-4 rounded border-line-strong accent-brand"
          />
          Только в наличии
        </label>
      </fieldset>
    </div>
  );
}

type FilterSidebarProps = Omit<FiltersPanelProps, "className">;

export function FilterSidebar(props: FilterSidebarProps) {
  return (
    <aside className="hidden lg:block">
      <div className="sticky top-24 rounded-card border border-line bg-surface p-4 shadow-card">
        <FiltersPanel {...props} />
      </div>
    </aside>
  );
}

type FilterSheetProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
};

export function FilterSheet({ open, onClose, children, footer }: FilterSheetProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Фильтры">
      <button
        type="button"
        aria-label="Закрыть фильтры"
        onClick={onClose}
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
      />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-sheet bg-surface shadow-float">
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <span className="text-base font-bold text-ink">Фильтры</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть"
            className="flex size-11 items-center justify-center rounded-full text-muted transition-colors hover:bg-brand-50 hover:text-ink"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>
        {footer ? (
          <div className="border-t border-line px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
