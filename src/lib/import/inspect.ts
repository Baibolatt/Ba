import {
  autoMapColumns,
  buildHeaderLabels,
  detectHeaderRow,
  isEmptyOrTotalRow,
  isRepeatedHeaderRow,
} from "./columns";
import type {
  ColumnMapping,
  ImportCurrency,
  ImportSettings,
  ParsedImportFile,
} from "./types";
import { IMPORT_FIELDS, IMPORT_FIELD_LABELS } from "./types";

const MAX_PREVIEW_COLUMNS = 200;
const SAMPLE_ROWS = 6;

export type SheetInspection = {
  sheet: string;
  sheetNames: string[];
  totalRows: number;
  headerRow: number;
  headers: string[];
  rawHeaders: string[];
  mapping: ColumnMapping;
  sampleRows: string[][];
  warnings: string[];
};

export class ImportInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportInputError";
  }
}

function maxWidth(rows: string[][], start: number): number {
  let width = 0;
  const limit = Math.min(rows.length, start + 50);

  for (let index = start; index < limit; index += 1) {
    width = Math.max(width, rows[index]?.length ?? 0);
  }

  return Math.min(Math.max(width, 1), MAX_PREVIEW_COLUMNS);
}

export function inspectSheet(
  parsed: ParsedImportFile,
  sheetName: string,
  headerRowOverride?: number,
): SheetInspection {
  const sheet =
    parsed.sheets.find((item) => item.name === sheetName) ?? parsed.sheets[0];

  if (!sheet) {
    throw new ImportInputError("В файле нет листов.");
  }

  const rows = sheet.rows;
  const warnings: string[] = [...parsed.warnings];

  if (rows.length === 0) {
    warnings.push("Лист пустой.");
  }

  const detected = detectHeaderRow(rows);
  let headerIndex = detected.headerIndex;

  if (
    headerRowOverride !== undefined &&
    Number.isInteger(headerRowOverride) &&
    headerRowOverride >= 1
  ) {
    headerIndex = Math.min(headerRowOverride - 1, Math.max(rows.length - 1, 0));
  }

  const width = maxWidth(rows, headerIndex);
  const headerCells = Array.from({ length: width }, (_, column) =>
    String(rows[headerIndex]?.[column] ?? ""),
  );

  const headers = buildHeaderLabels(headerCells, width);
  const mapping = autoMapColumns(headerCells);

  if (headerIndex > 0) {
    warnings.push(
      `Заголовки найдены в строке ${headerIndex + 1}. Если это не так, укажите номер строки вручную.`,
    );
  }

  if (detected.fieldsFound === 0 && headerRowOverride === undefined) {
    warnings.push(
      "Не удалось распознать названия колонок. Сопоставьте поля вручную.",
    );
  }

  const sampleRows: string[][] = [];
  let totalRows = 0;

  for (let index = headerIndex + 1; index < rows.length; index += 1) {
    const cells = rows[index] ?? [];
    if (
      isEmptyOrTotalRow(cells) ||
      isRepeatedHeaderRow(cells, headerCells, mapping)
    ) {
      continue;
    }

    totalRows += 1;

    if (sampleRows.length < SAMPLE_ROWS) {
      sampleRows.push(
        Array.from({ length: width }, (_, column) =>
          String(cells[column] ?? ""),
        ),
      );
    }
  }

  return {
    sheet: sheet.name,
    sheetNames: parsed.sheets.map((item) => item.name),
    totalRows,
    headerRow: headerIndex + 1,
    headers,
    rawHeaders: headerCells,
    mapping,
    sampleRows,
    warnings,
  };
}

export function parseMapping(
  raw: unknown,
  columnCount: number,
): ColumnMapping {
  if (!raw || typeof raw !== "object") {
    throw new ImportInputError("Не удалось прочитать сопоставление колонок.");
  }

  const source = raw as Record<string, unknown>;
  const mapping = {} as ColumnMapping;

  for (const field of IMPORT_FIELDS) {
    const value = source[field];

    if (value === null || value === undefined || value === "") {
      mapping[field] = null;
      continue;
    }

    const column = Number(value);

    if (!Number.isInteger(column) || column < 0 || column >= columnCount) {
      throw new ImportInputError(
        `Неверная колонка для поля «${IMPORT_FIELD_LABELS[field]}».`,
      );
    }

    mapping[field] = column;
  }

  return mapping;
}

export function validateSettings(raw: unknown): ImportSettings {
  if (!raw || typeof raw !== "object") {
    throw new ImportInputError("Не удалось прочитать настройки импорта.");
  }

  const source = raw as Record<string, unknown>;
  const currency = String(source.currency ?? "KZT") as ImportCurrency;

  if (currency !== "KZT" && currency !== "USD" && currency !== "CNY") {
    throw new ImportInputError("Неизвестная валюта.");
  }

  const rate =
    currency === "KZT" ? 1 : Number(source.rate);

  if (
    currency !== "KZT" &&
    (!Number.isFinite(rate) || rate <= 0 || rate > 1_000_000)
  ) {
    throw new ImportInputError(
      "Курс должен быть положительным числом не больше 1 000 000.",
    );
  }

  const markup = Number(source.markup ?? 0);

  if (!Number.isFinite(markup) || markup < -99 || markup > 1_000) {
    throw new ImportInputError(
      "Наценка должна быть числом от -99 до 1000 процентов.",
    );
  }

  return { currency, rate, markup };
}
