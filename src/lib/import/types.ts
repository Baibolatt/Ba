export const IMPORT_FIELDS = [
  "article",
  "name",
  "price",
  "quantity",
  "brand",
  "category",
  "compatibility",
  "unit",
] as const;

export type ImportField = (typeof IMPORT_FIELDS)[number];

export type ColumnMapping = Record<ImportField, number | null>;

export const IMPORT_FIELD_LABELS: Record<ImportField, string> = {
  article: "Артикул",
  name: "Название",
  price: "Цена",
  quantity: "Остаток",
  brand: "Бренд",
  category: "Категория",
  compatibility: "Совместимость",
  unit: "Ед. изм.",
};

export const IMPORT_FIELD_HINTS: Record<ImportField, string> = {
  article: "арт., код, SKU, part no, 编号, 货号",
  name: "наименование, товар, name, 名称",
  price: "цена, price, 价格",
  quantity: "кол-во, остаток, qty, stock, 库存",
  brand: "бренд, марка, brand, 品牌",
  category: "категория, группа, category, 分类",
  compatibility: "совместимость, fitment, 适用车型",
  unit: "ед. изм., unit, 单位",
};

export type ImportCurrency = "KZT" | "USD" | "CNY";

export const IMPORT_CURRENCIES: {
  value: ImportCurrency;
  label: string;
  symbol: string;
  rate: number;
}[] = [
  { value: "KZT", label: "Тенге", symbol: "₸", rate: 1 },
  { value: "USD", label: "Доллар", symbol: "$", rate: 520 },
  { value: "CNY", label: "Юань", symbol: "¥", rate: 72 },
];

export type ImportSettings = {
  currency: ImportCurrency;
  /** Сколько тенге стоит одна единица валюты файла. */
  rate: number;
  /** Наценка в процентах к пересчитанной цене. */
  markup: number;
};

export const DEFAULT_IMPORT_SETTINGS: ImportSettings = {
  currency: "KZT",
  rate: 1,
  markup: 0,
};

export type ImportRow = {
  /** Номер строки в файле, начиная с 1. Совпадает с номером в Excel. */
  rowNumber: number;
  cells: string[];
};

export type SheetData = {
  name: string;
  rows: string[][];
};

export type ParsedImportFile = {
  fileName: string;
  sheets: SheetData[];
  encoding?: string;
  delimiter?: string;
  warnings: string[];
};

export type HeaderDetection = {
  /** Индекс строки заголовков в массиве rows, начиная с 0. */
  headerIndex: number;
  /** Сколько известных полей нашлось в строке заголовков. */
  fieldsFound: number;
  confidence: "high" | "low";
};

export type PreparedProduct = {
  rowNumber: number;
  /** Нормализованный артикул для сопоставления. */
  key: string;
  article: string;
  existingId: string | null;
  name: string;
  /** Цена уже в тенге. */
  price: number;
  /** null — не менять остаток у существующего товара / 0 у нового. */
  quantity: number | null;
  unit: string | null;
  compatibility: string | null;
  brandName: string | null;
  categoryName: string | null;
};

export type RowIssue = {
  rowNumber: number;
  article: string;
  reason: string;
};

export type DuplicateGroup = {
  article: string;
  rows: number[];
};

export type ImportPlan = {
  prepared: PreparedProduct[];
  errors: RowIssue[];
  errorCount: number;
  duplicates: DuplicateGroup[];
  duplicateExtra: number;
  totalRows: number;
  createCount: number;
  updateCount: number;
  newBrands: string[];
  newCategories: string[];
  fallbackBrand: string | null;
  fallbackCategory: string | null;
  /** Все артикулы, которые были в файле (включая строки с ошибками). */
  fileArticleKeys: string[];
};

export type ImportPreviewRow = {
  rowNumber: number;
  article: string;
  name: string;
  price: number;
  quantity: number | null;
  unit: string;
  brand: string;
  category: string;
  compatibility: string;
  action: "add" | "update";
};

export type ImportAnalysisResult = {
  jobId: string;
  fileName: string;
  sheet: string;
  sheetNames: string[];
  totalRows: number;
  headerRow: number;
  headers: string[];
  rawHeaders: string[];
  mapping: ColumnMapping;
  sampleRows: string[][];
  encoding?: string;
  delimiter?: string;
  warnings: string[];
};

export type ImportPreviewResult = {
  stats: {
    totalRows: number;
    validRows: number;
    createCount: number;
    updateCount: number;
    errorCount: number;
    duplicateExtra: number;
    newBrands: number;
    newCategories: number;
  };
  errors: RowIssue[];
  errorsTruncated: boolean;
  duplicates: DuplicateGroup[];
  duplicatesTruncated: boolean;
  sample: ImportPreviewRow[];
  newBrands: string[];
  newCategories: string[];
  warnings: string[];
};

export type ImportChunkResult = {
  processed: number;
  total: number;
  added: number;
  updated: number;
  done: boolean;
};

export type ImportRunSummary = {
  fileName: string;
  createdAt: string;
  createdCount: number;
  updatedCount: number;
};
