import type { ImportCurrency } from "./types";

// Невидимые символы, которые часто попадают в прайс-листы из Excel и сайтов.
const INVISIBLE =
  /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F\u00AD\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g;

/** Убирает невидимые символы, лишние пробелы и нормализует Unicode. */
export function cleanText(value: unknown): string {
  if (value === null || value === undefined) return "";

  return String(value)
    .normalize("NFKC")
    .replace(INVISIBLE, " ")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Ключ артикула для поиска и сопоставления: регистр, пробелы, дефисы,
 * подчёркивания, точки и слэши не важны.
 */
export function normalizeArticle(value: unknown): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/[\s\-–—_./\\·•]+/g, "");
}

/** Артикул в том виде, в котором он попадёт в базу для нового товара. */
export function displayArticle(value: unknown): string {
  return cleanText(value).replace(/[–—]/g, "-");
}

/** Ключ названия бренда или категории: регистр и лишние пробелы не важны. */
export function normalizeEntityName(value: unknown): string {
  return cleanText(value).toLowerCase();
}

export type ParsedPrice =
  | { value: number; empty: false; error?: undefined }
  | { value: null; empty: true; error?: undefined }
  | { value: null; empty: false; error: string };

const CURRENCY_PATTERN =
  /(₸|тг\.?|тенге|kzt|₽|руб\.?|рублей|р\.|usd|долл\.?|dollar|\$|¥|￥|cny|rmb|юань|元|€|eur|евро)/gi;

/**
 * Разбирает цену из ячейки. Понимает пробелы, запятые, точки, символы валют и
 * приписки вроде «тг». Пустая ячейка возвращается отдельно от ошибки.
 */
export function parsePrice(raw: unknown, currency: ImportCurrency): ParsedPrice {
  const text = cleanText(raw);
  if (!text) return { value: null, empty: true };

  const withoutCurrency = text
    .replace(CURRENCY_PATTERN, " ")
    .replace(/\u00A0/g, " ")
    .replace(/[\s'’]/g, "");

  // Оставляем только цифры и разделители: «12 500 тг/шт» → «12500».
  const numeric = withoutCurrency.replace(/[^\d.,+-]/g, "").replace(/\+/g, "");

  if (!numeric) {
    return {
      value: null,
      empty: false,
      error: `Не удалось разобрать цену: «${text}»`,
    };
  }

  if (numeric.startsWith("-")) {
    return {
      value: null,
      empty: false,
      error: `Цена не может быть отрицательной: «${text}»`,
    };
  }

  const value = parseSeparatedNumber(numeric, currency);
  if (value === null || !Number.isFinite(value) || value < 0) {
    return {
      value: null,
      empty: false,
      error: `Не удалось разобрать цену: «${text}»`,
    };
  }

  return { value, empty: false };
}

function parseSeparatedNumber(
  raw: string,
  currency: ImportCurrency,
): number | null {
  const hasComma = raw.includes(",");
  const hasDot = raw.includes(".");

  if (hasComma && hasDot) {
    const decimal = raw.lastIndexOf(",") > raw.lastIndexOf(".") ? "," : ".";
    const thousands = decimal === "," ? "." : ",";
    const compact = raw.split(thousands).join("");
    const parts = compact.split(decimal);

    if (parts.length > 2) {
      const normalized = `${parts.slice(0, -1).join("")}.${parts.at(-1)}`;
      return Number(normalized);
    }

    return Number(parts.join("."));
  }

  if (hasComma || hasDot) {
    const separator = hasComma ? "," : ".";
    const parts = raw.split(separator);
    if (parts.length === 1) return Number(raw);

    const last = parts.at(-1) ?? "";

    // Несколько разделителей — это разделители тысяч: 1.234.567.
    if (parts.length > 2) {
      return Number(parts.join(""));
    }

    if (last.length === 3) {
      const looksLikeThousands =
        separator === "," || currency === "KZT";
      return Number(looksLikeThousands ? parts.join("") : parts.join("."));
    }

    return Number(parts.join("."));
  }

  return Number(raw);
}

export type ParsedQuantity =
  | { value: number; empty: false; error?: undefined }
  | { value: null; empty: true; error?: undefined }
  | { value: null; empty: false; error: string };

const ZERO_WORDS = /^(нет|отсутствует|отсутств\.?|no|none|out of stock|n\/a|—|-|無|无|缺货|无货)$/i;
const POSITIVE_WORDS = /^(есть|в наличии|да|yes|in stock|有|有货|现货)$/i;

/**
 * Разбирает остаток. Понимает «5 шт», «>10», «10+», «есть», «нет».
 * Пустая ячейка означает «не менять остаток» и отличается от ошибки.
 */
export function parseQuantity(raw: unknown): ParsedQuantity {
  const text = cleanText(raw);
  if (!text) return { value: null, empty: true };

  if (ZERO_WORDS.test(text)) return { value: 0, empty: false };
  if (POSITIVE_WORDS.test(text)) return { value: 1, empty: false };

  const normalized = text.toLowerCase().replace(/\u00A0/g, " ");

  const greaterOrEqual = /^(?:>=|≥|от)\s*/.test(normalized);
  const lessOrEqual = /^(?:<=|≤)\s*/.test(normalized);
  const greater =
    !greaterOrEqual && /^(?:>|более|больше|свыше)\s*/.test(normalized);
  const less = !lessOrEqual && /^(?:<|менее|меньше)\s*/.test(normalized);

  const match = normalized.match(/\d[\d\s.,]*/);
  if (!match) {
    return {
      value: null,
      empty: false,
      error: `Не удалось разобрать остаток: «${text}»`,
    };
  }

  const numeric = parseSeparatedNumber(
    match[0].replace(/[\s]/g, ""),
    "KZT",
  );

  if (numeric === null || !Number.isFinite(numeric)) {
    return {
      value: null,
      empty: false,
      error: `Не удалось разобрать остаток: «${text}»`,
    };
  }

  let value = Math.floor(Math.abs(numeric));

  if (greater) value += 1;
  if (less) value = Math.max(0, value - 1);

  return {
    value: Math.min(value, 1_000_000),
    empty: false,
  };
}

/** Пересчитывает цену из валюты файла в тенге с учётом наценки. */
export function convertPriceToKzt(
  price: number,
  rate: number,
  markupPercent: number,
): number {
  return Math.round(price * rate * (1 + markupPercent / 100));
}
