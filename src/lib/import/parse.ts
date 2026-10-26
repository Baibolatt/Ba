import * as XLSX from "xlsx";
import iconv from "iconv-lite";
import type { ParsedImportFile, SheetData } from "./types";

export const MAX_IMPORT_ROWS = 100_000;

export class ImportParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportParseError";
  }
}

const MAX_COLUMNS = 500;

function trimTrailingEmptyRows(rows: string[][]): string[][] {
  let last = rows.length - 1;

  while (
    last >= 0 &&
    rows[last].every((cell) => !String(cell ?? "").trim())
  ) {
    last -= 1;
  }

  return rows.slice(0, last + 1);
}

function toCellStrings(rows: unknown[][]): string[][] {
  return rows.map((row) =>
    Array.isArray(row)
      ? row.slice(0, MAX_COLUMNS).map((cell) => (cell === null || cell === undefined ? "" : String(cell)))
      : [],
  );
}

type DecodedText = { text: string; encoding: string };

/**
 * Определяет кодировку CSV: BOM, затем строгий UTF-8, иначе Windows-1251.
 */
export function decodeImportText(buffer: Buffer): DecodedText {
  if (
    buffer.length >= 3 &&
    buffer[0] === 0xef &&
    buffer[1] === 0xbb &&
    buffer[2] === 0xbf
  ) {
    return {
      text: new TextDecoder("utf-8").decode(buffer.subarray(3)),
      encoding: "UTF-8 (BOM)",
    };
  }

  if (buffer.length >= 2 && buffer[0] === 0xff && buffer[1] === 0xfe) {
    return {
      text: new TextDecoder("utf-16le").decode(buffer.subarray(2)),
      encoding: "UTF-16LE",
    };
  }

  if (buffer.length >= 2 && buffer[0] === 0xfe && buffer[1] === 0xff) {
    return {
      text: new TextDecoder("utf-16be").decode(buffer.subarray(2)),
      encoding: "UTF-16BE",
    };
  }

  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    return { text, encoding: "UTF-8" };
  } catch {
    return {
      text: iconv.decode(buffer, "win1251"),
      encoding: "Windows-1251",
    };
  }
}

/** Разбирает CSV с кавычками, удвоенными кавычками и переносами в ячейках. */
export function parseCsv(text: string, delimiter: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];

    if (inQuotes) {
      if (char === '"') {
        if (text[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
      continue;
    }

    if (char === '"' && cell.length === 0) {
      inQuotes = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n") {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else if (char !== "\r") {
      cell += char;
    }
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }

  return rows.map((cells) =>
    cells.slice(0, MAX_COLUMNS).map((value) => value.trim()),
  );
}

/**
 * Выбирает разделитель по согласованности числа колонок в первых строках.
 */
export function detectDelimiter(text: string): string {
  const sample = text.slice(0, 64_000);
  const candidates = [";", ",", "\t", "|"];

  let bestDelimiter = ",";
  let bestScore = 0;

  for (const delimiter of candidates) {
    const rows = parseCsv(sample, delimiter).slice(0, 60);
    const widths = rows
      .map((row) => row.length)
      .filter((width) => width > 1);

    if (widths.length === 0) continue;

    const frequencies = new Map<number, number>();
    for (const width of widths) {
      frequencies.set(width, (frequencies.get(width) ?? 0) + 1);
    }

    let modeWidth = 0;
    let modeCount = 0;
    for (const [width, count] of frequencies) {
      if (count > modeCount || (count === modeCount && width > modeWidth)) {
        modeWidth = width;
        modeCount = count;
      }
    }

    const consistency = modeCount / widths.length;
    const score = modeWidth * consistency;

    if (score > bestScore) {
      bestScore = score;
      bestDelimiter = delimiter;
    }
  }

  return bestDelimiter;
}

function delimiterLabel(delimiter: string): string {
  if (delimiter === "\t") return "табуляция";
  if (delimiter === ";") return "точка с запятой";
  if (delimiter === ",") return "запятая";
  return "вертикальная черта";
}

function sheetRows(sheet: XLSX.WorkSheet): string[][] {
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    raw: false,
    defval: "",
    blankrows: true,
  });

  return trimTrailingEmptyRows(toCellStrings(rows));
}

function isZip(buffer: Buffer): boolean {
  return buffer.length > 3 && buffer[0] === 0x50 && buffer[1] === 0x4b;
}

function isCompoundFile(buffer: Buffer): boolean {
  return (
    buffer.length > 7 &&
    buffer[0] === 0xd0 &&
    buffer[1] === 0xcf &&
    buffer[2] === 0x11 &&
    buffer[3] === 0xe0
  );
}

function parseSpreadsheet(buffer: Buffer, fileName: string): ParsedImportFile {
  let workbook: XLSX.WorkBook;

  try {
    workbook = XLSX.read(buffer, { type: "buffer", cellDates: false });
  } catch {
    throw new ImportParseError(
      "Не удалось прочитать файл Excel. Сохраните его в формате .xlsx, .xls или .csv.",
    );
  }

  if (workbook.SheetNames.length === 0) {
    throw new ImportParseError("В файле нет ни одного листа.");
  }

  const sheets: SheetData[] = workbook.SheetNames.map((name) => ({
    name,
    rows: sheetRows(workbook.Sheets[name]),
  }));

  const maxRows = Math.max(...sheets.map((sheet) => sheet.rows.length));
  if (maxRows > MAX_IMPORT_ROWS) {
    throw new ImportParseError(
      `В файле больше ${MAX_IMPORT_ROWS.toLocaleString("ru-RU")} строк. Разделите файл на части.`,
    );
  }

  return {
    fileName,
    sheets,
    warnings:
      sheets.length > 1
        ? [`В файле ${sheets.length} листа. Выберите нужный лист.`]
        : [],
  };
}

function parseTextFile(buffer: Buffer, fileName: string): ParsedImportFile {
  const { text, encoding } = decodeImportText(buffer);
  const delimiter = detectDelimiter(text);
  const rows = trimTrailingEmptyRows(
    parseCsv(text, delimiter).map((cells) =>
      cells.map((cell) => String(cell ?? "")),
    ),
  );

  if (rows.length > MAX_IMPORT_ROWS) {
    throw new ImportParseError(
      `В файле больше ${MAX_IMPORT_ROWS.toLocaleString("ru-RU")} строк. Разделите файл на части.`,
    );
  }

  return {
    fileName,
    sheets: [{ name: fileName, rows }],
    encoding,
    delimiter: delimiterLabel(delimiter),
    warnings: [],
  };
}

/** Читает .xlsx, .xls или .csv из буфера и возвращает все листы. */
export function parseImportFile(
  buffer: Buffer,
  fileName: string,
): ParsedImportFile {
  if (buffer.length === 0) {
    throw new ImportParseError("Файл пустой.");
  }

  const extension = fileName.toLowerCase().split(".").pop() ?? "";

  if (extension === "csv" || extension === "txt") {
    return parseTextFile(buffer, fileName);
  }

  if (extension === "xlsx" || extension === "xls" || extension === "xlsm") {
    if (isZip(buffer) || isCompoundFile(buffer)) {
      return parseSpreadsheet(buffer, fileName);
    }

    // Некоторые выгрузки называют CSV файлом .xls — пробуем прочитать как текст.
    return parseTextFile(buffer, fileName);
  }

  if (isZip(buffer) || isCompoundFile(buffer)) {
    return parseSpreadsheet(buffer, fileName);
  }

  return parseTextFile(buffer, fileName);
}
