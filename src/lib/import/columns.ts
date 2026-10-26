import {
  IMPORT_FIELDS,
  type ColumnMapping,
  type HeaderDetection,
  type ImportField,
} from "./types";

/**
 * Синонимы заголовков на русском, английском, транслите и китайском.
 * Сравнение идёт по нормализованной строке: без регистра, пробелов и знаков.
 */
const HEADER_ALIASES: Record<ImportField, string[]> = {
  article: [
    "артикул",
    "арт",
    "арт.",
    "код",
    "кодтовара",
    "каталожныйномер",
    "номер",
    "номердетали",
    "sku",
    "partno",
    "partnumber",
    "part",
    "productno",
    "itemno",
    "vendorcode",
    "artikul",
    "art",
    "kod",
    "nomer",
    "编号",
    "货号",
    "零件号",
    "料号",
  ],
  name: [
    "наименование",
    "название",
    "названиетовара",
    "товар",
    "наименованиетовара",
    "name",
    "productname",
    "product",
    "itemname",
    "item",
    "title",
    "naimenovanie",
    "nazvanie",
    "tovar",
    "名称",
    "品名",
    "商品名称",
    "产品名称",
  ],
  price: [
    "цена",
    "ценазашт",
    "стоимость",
    "прайс",
    "price",
    "unitprice",
    "cost",
    "cena",
    "tsena",
    "stoimost",
    "价格",
    "单价",
    "售价",
    "价格元",
  ],
  quantity: [
    "количество",
    "колво",
    "кол",
    "остаток",
    "остатки",
    "наличие",
    "склад",
    "qty",
    "quantity",
    "stock",
    "onhand",
    "instock",
    "available",
    "kolichestvo",
    "kolvo",
    "ostatok",
    "nalichie",
    "库存",
    "数量",
    "存货",
  ],
  brand: [
    "бренд",
    "марка",
    "производитель",
    "brand",
    "manufacturer",
    "vendor",
    "make",
    "brend",
    "marka",
    "proizvoditel",
    "品牌",
    "厂商",
    "厂家",
  ],
  category: [
    "категория",
    "группа",
    "раздел",
    "подкатегория",
    "category",
    "group",
    "type",
    "kategoriya",
    "gruppa",
    "razdel",
    "分类",
    "类别",
    "品类",
  ],
  compatibility: [
    "совместимость",
    "применяемость",
    "автомобиль",
    "авто",
    "маркамодель",
    "compatibility",
    "fitment",
    "application",
    "vehicle",
    "sovmestimost",
    "primenyaemost",
    "适用车型",
    "车型",
    "适用",
  ],
  unit: [
    "единицаизмерения",
    "едизм",
    "единица",
    "ед",
    "unit",
    "uom",
    "measure",
    "edinitsa",
    "edizm",
    "单位",
    "计量单位",
  ],
};

type AliasIndexEntry = {
  field: ImportField;
  alias: string;
};

const ALIAS_INDEX: AliasIndexEntry[] = IMPORT_FIELDS.flatMap((field) =>
  HEADER_ALIASES[field].map((alias) => ({
    field,
    alias: normalizeHeader(alias),
  })),
)
  .filter((entry) => entry.alias.length > 0)
  .sort((a, b) => b.alias.length - a.alias.length);

/** Нормализует заголовок для сравнения: регистр, ё, пробелы и знаки. */
export function normalizeHeader(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKC")
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}]+/gu, "");
}

type FieldMatch = {
  field: ImportField;
  score: number;
};

function matchHeader(normalized: string): FieldMatch | null {
  if (!normalized) return null;

  let best: FieldMatch | null = null;

  for (const { field, alias } of ALIAS_INDEX) {
    let score = 0;

    if (normalized === alias) {
      score = 1000;
    } else if (alias.length < 3) {
      // Короткие «ед», «арт» и «код» ищем только точным совпадением.
      continue;
    } else if (normalized.startsWith(alias) || normalized.endsWith(alias)) {
      score = 300 + alias.length * 5;
    } else if (normalized.includes(alias)) {
      score = 150 + alias.length * 3;
    }

    if (score > 0 && (!best || score > best.score)) {
      best = { field, score };
    }
  }

  return best;
}

type RowMatches = Map<ImportField, { column: number; score: number }>;

/** Находит в строке как можно больше разных известных полей (для заголовка). */
function matchRowFields(cells: string[]): RowMatches {
  const candidates: {
    field: ImportField;
    column: number;
    score: number;
  }[] = [];

  cells.forEach((cell, column) => {
    const normalized = normalizeHeader(cell);
    if (!normalized || normalized.length > 80) return;

    const match = matchHeader(normalized);
    if (match) {
      candidates.push({ ...match, column });
    }
  });

  candidates.sort(
    (a, b) => b.score - a.score || a.column - b.column,
  );

  const result: RowMatches = new Map();
  const usedColumns = new Set<number>();

  for (const candidate of candidates) {
    if (result.has(candidate.field) || usedColumns.has(candidate.column)) {
      continue;
    }
    result.set(candidate.field, {
      column: candidate.column,
      score: candidate.score,
    });
    usedColumns.add(candidate.column);
  }

  return result;
}

function rowIsEmpty(cells: string[]): boolean {
  return cells.every((cell) => !String(cell ?? "").trim());
}

/**
 * Ищет строку заголовков: пропускает пустые строки и «шапку» компании.
 * Если известных названий не нашлось, берёт первую строку с двумя колонками.
 */
export function detectHeaderRow(rows: string[][]): HeaderDetection {
  let bestIndex = -1;
  let bestCount = 0;

  const limit = Math.min(rows.length, 80);

  for (let index = 0; index < limit; index += 1) {
    const cells = rows[index] ?? [];
    const nonEmpty = cells.filter((cell) => String(cell ?? "").trim()).length;
    if (nonEmpty < 2) continue;

    const matches = matchRowFields(cells);
    const count = matches.size;

    if (
      count > bestCount ||
      (count === bestCount && count >= 2 && bestIndex === -1)
    ) {
      bestIndex = index;
      bestCount = count;
    }
  }

  if (bestIndex >= 0 && bestCount >= 2) {
    return {
      headerIndex: bestIndex,
      fieldsFound: bestCount,
      confidence: bestCount >= 4 ? "high" : "low",
    };
  }

  const firstWide = rows.findIndex(
    (cells) =>
      (cells ?? []).filter((cell) => String(cell ?? "").trim()).length >= 2,
  );

  return {
    headerIndex: firstWide >= 0 ? firstWide : 0,
    fieldsFound: 0,
    confidence: "low",
  };
}

/** Подписи колонок для интерфейса; пустые и повторяющиеся получают номер. */
export function buildHeaderLabels(
  headerCells: string[],
  maxColumns: number,
): string[] {
  const labels: string[] = [];
  const used = new Map<string, number>();

  for (let column = 0; column < maxColumns; column += 1) {
    const raw = String(headerCells[column] ?? "").trim();
    const base = raw || `Колонка ${column + 1}`;
    const seen = used.get(base) ?? 0;
    used.set(base, seen + 1);

    labels.push(seen === 0 ? base : `${base} (${seen + 1})`);
  }

  return labels;
}

/** Автоматически сопоставляет поля с колонками по названиям заголовков. */
export function autoMapColumns(headerCells: string[]): ColumnMapping {
  const mapping = Object.fromEntries(
    IMPORT_FIELDS.map((field) => [field, null]),
  ) as ColumnMapping;

  const candidates: {
    field: ImportField;
    column: number;
    score: number;
  }[] = [];

  headerCells.forEach((cell, column) => {
    const normalized = normalizeHeader(cell);
    if (!normalized) return;

    const match = matchHeader(normalized);
    if (match) candidates.push({ ...match, column });
  });

  candidates.sort((a, b) => b.score - a.score || a.column - b.column);

  const usedColumns = new Set<number>();

  for (const candidate of candidates) {
    if (mapping[candidate.field] !== null || usedColumns.has(candidate.column)) {
      continue;
    }
    mapping[candidate.field] = candidate.column;
    usedColumns.add(candidate.column);
  }

  return mapping;
}

/**
 * Повторная строка заголовков внутри данных — её нужно пропустить.
 * Без строки заголовков работает по эвристике (три и более известных поля).
 */
export function isRepeatedHeaderRow(
  cells: string[],
  headerCells?: string[],
  mapping?: ColumnMapping,
): boolean {
  if (headerCells && mapping) {
    let mapped = 0;
    let matches = 0;

    for (const field of IMPORT_FIELDS) {
      const column = mapping[field];
      if (column === null || column === undefined) continue;

      mapped += 1;
      const cell = normalizeHeader(cells[column]);
      const header = normalizeHeader(headerCells[column]);

      if (cell && header && cell === header) {
        matches += 1;
      }
    }

    return (
      matches >= 3 ||
      (mapped >= 2 && matches === mapped)
    );
  }

  return matchRowFields(cells).size >= 3;
}

/** Пустые ли данные или это итоговая строка вроде «Итого». */
export function isEmptyOrTotalRow(cells: string[]): boolean {
  if (rowIsEmpty(cells)) return true;

  const nonEmpty = cells.filter((cell) => String(cell ?? "").trim());
  if (nonEmpty.length > 2) return false;

  return /^(итого|всего|total|subtotal|sum|合计|总计)(?:\s|$)/i.test(
    String(nonEmpty[0] ?? "").trim(),
  );
}
