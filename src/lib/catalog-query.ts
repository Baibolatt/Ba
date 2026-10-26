export const CATALOG_PAGE_SIZE = 8;

export const catalogSorts = [
  "popular",
  "price-asc",
  "price-desc",
  "name",
] as const;

export type CatalogSort = (typeof catalogSorts)[number];
export type CatalogViewMode = "grid" | "table";

export type CatalogFilters = {
  brands: string[];
  minPrice: number | null;
  maxPrice: number | null;
  inStockOnly: boolean;
};

export type CatalogQuery = {
  filters: CatalogFilters;
  sort: CatalogSort;
  view: CatalogViewMode;
  page: number;
};

export type RawSearchParams = Record<
  string,
  string | string[] | undefined
>;

export const emptyCatalogFilters: CatalogFilters = {
  brands: [],
  minPrice: null,
  maxPrice: null,
  inStockOnly: false,
};

function firstValue(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return typeof raw === "string" ? raw.trim() : "";
}

function parsePrice(value: string | string[] | undefined): number | null {
  const raw = firstValue(value);
  if (!/^\d+$/.test(raw)) return null;

  const parsed = Number(raw);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

function isSort(value: string): value is CatalogSort {
  return catalogSorts.some((sort) => sort === value);
}

export function parseCatalogQuery(
  raw: RawSearchParams,
  brandNames: string[],
): CatalogQuery {
  const brandByLowerCase = new Map(
    brandNames.map((name) => [name.toLowerCase(), name]),
  );
  const rawBrands = Array.isArray(raw.brand)
    ? raw.brand
    : raw.brand
      ? [raw.brand]
      : [];

  const brands = Array.from(
    new Set(
      rawBrands
        .flatMap((value) => value.split(","))
        .map((value) => brandByLowerCase.get(value.trim().toLowerCase()))
        .filter((value): value is string => Boolean(value)),
    ),
  );

  let minPrice = parsePrice(raw.min);
  let maxPrice = parsePrice(raw.max);
  if (minPrice !== null && maxPrice !== null && minPrice > maxPrice) {
    [minPrice, maxPrice] = [maxPrice, minPrice];
  }

  const sortValue = firstValue(raw.sort);
  const sort = isSort(sortValue) ? sortValue : "popular";
  const view = firstValue(raw.view) === "table" ? "table" : "grid";
  const pageValue = Number(firstValue(raw.page));
  const page =
    Number.isSafeInteger(pageValue) && pageValue > 0 ? pageValue : 1;

  return {
    filters: {
      brands,
      minPrice,
      maxPrice,
      inStockOnly: firstValue(raw.stock) === "1",
    },
    sort,
    view,
    page,
  };
}

export function catalogHref(pathname: string, query: CatalogQuery): string {
  const params = new URLSearchParams();

  for (const brand of query.filters.brands) params.append("brand", brand);
  if (query.filters.minPrice !== null) {
    params.set("min", String(query.filters.minPrice));
  }
  if (query.filters.maxPrice !== null) {
    params.set("max", String(query.filters.maxPrice));
  }
  if (query.filters.inStockOnly) params.set("stock", "1");
  if (query.sort !== "popular") params.set("sort", query.sort);
  if (query.view === "table") params.set("view", "table");
  if (query.page > 1) params.set("page", String(query.page));

  const search = params.toString();
  return search ? `${pathname}?${search}` : pathname;
}

export function catalogFiltersKey(filters: CatalogFilters): string {
  return JSON.stringify(filters);
}
