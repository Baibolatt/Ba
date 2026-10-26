import {
  cleanText,
  convertPriceToKzt,
  displayArticle,
  normalizeArticle,
  normalizeEntityName,
  parsePrice,
  parseQuantity,
} from "./clean";
import { isEmptyOrTotalRow, isRepeatedHeaderRow } from "./columns";
import type { CatalogSnapshot } from "./snapshot";
import type {
  ColumnMapping,
  DuplicateGroup,
  ImportField,
  ImportPlan,
  ImportSettings,
  PreparedProduct,
  RowIssue,
} from "./types";

export const FALLBACK_BRAND = "Без бренда";
export const FALLBACK_CATEGORY = "Без категории";

const MAX_ERRORS_STORED = 1_000;
const MAX_PRICE = 100_000_000;

export type PlanImportInput = {
  rows: string[][];
  headerIndex: number;
  mapping: ColumnMapping;
  settings: ImportSettings;
  snapshot: CatalogSnapshot;
};

export function planImport({
  rows,
  headerIndex,
  mapping,
  settings,
  snapshot,
}: PlanImportInput): ImportPlan {
  const currency = settings.currency;
  const rate =
    currency === "KZT"
      ? 1
      : Number.isFinite(settings.rate) && settings.rate > 0
        ? settings.rate
        : 1;
  const markup =
    Number.isFinite(settings.markup) && settings.markup >= -99
      ? settings.markup
      : 0;

  const prepared: PreparedProduct[] = [];
  const errors: RowIssue[] = [];
  let errorCount = 0;
  let totalRows = 0;

  const newBrands = new Map<string, string>();
  const newCategories = new Map<string, string>();

  const seen = new Map<string, number>();
  const duplicateRows = new Map<string, number[]>();
  const duplicateArticle = new Map<string, string>();
  const fileArticleKeys = new Set<string>();

  let usesFallbackBrand = false;
  let usesFallbackCategory = false;

  const firstDataIndex = headerIndex + 1;
  const headerCells = rows[headerIndex] ?? [];

  for (
    let dataIndex = firstDataIndex;
    dataIndex < rows.length;
    dataIndex += 1
  ) {
    const cells = rows[dataIndex] ?? [];
    const rowNumber = dataIndex + 1;

    if (
      isEmptyOrTotalRow(cells) ||
      isRepeatedHeaderRow(cells, headerCells, mapping)
    ) {
      continue;
    }

    totalRows += 1;

    const cell = (field: ImportField): string => {
      const column = mapping[field];
      if (column === null || column === undefined) return "";
      return String(cells[column] ?? "");
    };

    const articleRaw = cell("article");
    const articleKey = normalizeArticle(articleRaw);

    const addError = (reason: string) => {
      errorCount += 1;
      if (errors.length < MAX_ERRORS_STORED) {
        errors.push({
          rowNumber,
          article: displayArticle(articleRaw),
          reason,
        });
      }
    };

    if (!articleKey) {
      addError("Не указан артикул");
      continue;
    }

    fileArticleKeys.add(articleKey);

    const existing = snapshot.productByKey.get(articleKey) ?? null;

    const nameRaw = cleanText(cell("name"));
    const name = (nameRaw || existing?.name || "").slice(0, 300);

    if (!name) {
      addError("Не указано название товара");
      continue;
    }

    const priceRaw = cell("price");
    const parsedPrice = parsePrice(priceRaw, currency);

    if (parsedPrice.error) {
      addError(parsedPrice.error);
      continue;
    }

    let price: number;

    if (parsedPrice.empty) {
      if (!existing) {
        addError("Не указана цена");
        continue;
      }
      price = existing.price;
    } else if (parsedPrice.value !== null) {
      price = convertPriceToKzt(parsedPrice.value, rate, markup);

      if (price < 0 || price > MAX_PRICE) {
        addError(
          `Цена после пересчёта вне диапазона: ${price.toLocaleString("ru-RU")} ₸`,
        );
        continue;
      }
    } else {
      addError("Не указана цена");
      continue;
    }

    const parsedQuantity = parseQuantity(cell("quantity"));

    if (parsedQuantity.error) {
      addError(parsedQuantity.error);
      continue;
    }

    const unitRaw = cleanText(cell("unit")).slice(0, 40);
    const compatibilityRaw = cleanText(cell("compatibility")).slice(0, 1_000);
    const brandRaw = cleanText(cell("brand")).slice(0, 120);
    const categoryRaw = cleanText(cell("category")).slice(0, 120);

    let brandName: string | null = brandRaw || null;
    let categoryName: string | null = categoryRaw || null;

    if (brandName) {
      registerEntity(brandName, snapshot.brandByName, newBrands);
    } else if (!existing) {
      brandName = FALLBACK_BRAND;
      usesFallbackBrand = true;
      registerEntity(FALLBACK_BRAND, snapshot.brandByName, newBrands);
    }

    if (categoryName) {
      registerEntity(categoryName, snapshot.categoryByName, newCategories);
    } else if (!existing) {
      categoryName = FALLBACK_CATEGORY;
      usesFallbackCategory = true;
      registerEntity(FALLBACK_CATEGORY, snapshot.categoryByName, newCategories);
    }

    const record: PreparedProduct = {
      rowNumber,
      key: articleKey,
      article: existing?.article ?? displayArticle(articleRaw).slice(0, 120),
      existingId: existing?.id ?? null,
      name,
      price,
      quantity: parsedQuantity.empty ? null : parsedQuantity.value,
      unit: unitRaw || existing?.unit || null,
      compatibility:
        compatibilityRaw || existing?.compatibility || null,
      brandName,
      categoryName,
    };

    const previousIndex = seen.get(articleKey);

    if (previousIndex !== undefined) {
      // Внутри файла побеждает последняя строка с тем же артикулом.
      prepared[previousIndex] = record;
      duplicateRows.get(articleKey)?.push(rowNumber);
      duplicateArticle.set(articleKey, record.article);
      continue;
    }

    seen.set(articleKey, prepared.length);
    prepared.push(record);
    duplicateRows.set(articleKey, [rowNumber]);
    duplicateArticle.set(articleKey, record.article);
  }

  const duplicates: DuplicateGroup[] = [];
  let duplicateExtra = 0;

  for (const [key, groupRows] of duplicateRows) {
    if (groupRows.length < 2) continue;
    duplicateExtra += groupRows.length - 1;
    duplicates.push({
      article: duplicateArticle.get(key) ?? key,
      rows: groupRows,
    });
  }

  const createCount = prepared.filter((record) => !record.existingId).length;

  return {
    prepared,
    errors,
    errorCount,
    duplicates,
    duplicateExtra,
    totalRows,
    createCount,
    updateCount: prepared.length - createCount,
    newBrands: [...newBrands.values()],
    newCategories: [...newCategories.values()],
    fallbackBrand: usesFallbackBrand ? FALLBACK_BRAND : null,
    fallbackCategory: usesFallbackCategory ? FALLBACK_CATEGORY : null,
    fileArticleKeys: [...fileArticleKeys],
  };
}

function registerEntity(
  name: string,
  existing: Map<string, unknown>,
  target: Map<string, string>,
) {
  const key = normalizeEntityName(name);
  if (!key || existing.has(key) || target.has(key)) return;
  target.set(key, name);
}
