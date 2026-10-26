import { normalizeArticle } from "@/lib/import/clean";
import type { Product } from "@/lib/types";

/** Ограничение длины запроса: защищает разбор и промпт от простыни текста. */
export const MAX_SEARCH_QUERY_LENGTH = 200;
export const MAX_AI_CANDIDATES = 20;

/**
 * Частые русские окончания, отсортированные от длинных к коротким.
 * Отсекаем только одно окончание, иначе «масляный» и «масляного» могут
 * разойтись сильнее, чем нужно.
 */
const RUSSIAN_ENDINGS = [
  "иями",
  "ями",
  "ами",
  "ыми",
  "ими",
  "ого",
  "его",
  "ому",
  "ему",
  "ая",
  "яя",
  "ое",
  "ее",
  "ые",
  "ие",
  "ых",
  "их",
  "ом",
  "ем",
  "ам",
  "ям",
  "ах",
  "ях",
  "ую",
  "юю",
  "ия",
  "ию",
  "ии",
  "ов",
  "ев",
  "ый",
  "ий",
  "ой",
  "ей",
  "и",
  "ы",
  "а",
  "я",
  "о",
  "е",
  "у",
  "ю",
  "ь",
];

const STOP_WORDS = new Set([
  "для",
  "под",
  "над",
  "при",
  "без",
  "про",
  "через",
  "или",
  "это",
  "этот",
  "эта",
  "эти",
  "как",
  "что",
  "все",
  "его",
  "она",
  "они",
  "оно",
  "так",
  "там",
  "тут",
  "уже",
  "еще",
  "если",
  "есть",
  "чтобы",
  "когда",
  "где",
  "чем",
  "того",
  "мой",
  "моя",
  "мое",
  "мои",
  "ваш",
  "ваша",
  "ваше",
  "ваши",
]);

export type SearchHit = {
  product: Product;
  score: number;
  /** Совпали все значимые слова запроса или артикул/фраза целиком. */
  matchedAll: boolean;
  exactArticle: boolean;
};

/** Нижний регистр, «ё → е», пунктуация превращается в пробелы. */
export function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^a-zа-я0-9]+/g, " ")
    .trim();
}

/** Значимые слова запроса без служебных слов и коротких обрывков. */
export function tokenize(text: string): string[] {
  const tokens = normalizeSearchText(text)
    .split(/\s+/)
    .filter((token) => token.length >= 3 && !STOP_WORDS.has(token));

  return Array.from(new Set(tokens));
}

/**
 * Основа слова: «масляный» и «масленый» дают «маслян» и «маслен»,
 * расстояние между которыми — одна буква. Односложные окончания у коротких
 * слов не трогаем, иначе «масло» и «техно» теряют смысл.
 */
export function stemWord(word: string): string {
  let stem = normalizeSearchText(word).replace(/\s+/g, "");
  if (!stem) return "";

  if (/^[a-z0-9]+$/.test(stem)) {
    return stem.length >= 4 && stem.endsWith("s")
      ? stem.slice(0, -1)
      : stem;
  }

  for (const ending of RUSSIAN_ENDINGS) {
    if (!stem.endsWith(ending)) continue;
    if (stem.length - ending.length < 3) continue;
    if (ending.length === 1 && stem.length < 6) continue;

    stem = stem.slice(0, -ending.length);
    break;
  }

  return stem;
}

/** Расстояние Левенштейна с ранним выходом, если оно уже больше лимита. */
function isEditDistanceAtMost(a: string, b: string, limit: number): boolean {
  if (Math.abs(a.length - b.length) > limit) return false;

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);

  for (let row = 1; row <= a.length; row += 1) {
    const current = [row];
    let rowMin = row;

    for (let column = 1; column <= b.length; column += 1) {
      const cost = a[row - 1] === b[column - 1] ? 0 : 1;
      const value = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + cost,
      );
      current.push(value);
      rowMin = Math.min(rowMin, value);
    }

    if (rowMin > limit) return false;
    previous = current;
  }

  return previous[b.length] <= limit;
}

/** Совпадение основ: точное, по префиксу или с одной-двумя опечатками. */
function stemMatchScore(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 3;

  // Цифры сравниваем только точно: иначе «TL-2418» цепляется за год 2018.
  if (/\d/.test(a) || /\d/.test(b)) return 0;

  const shorter = a.length <= b.length ? a : b;
  const longer = shorter === a ? b : a;

  if (
    shorter.length >= 4 &&
    longer.startsWith(shorter) &&
    shorter.length / longer.length >= 0.5
  ) {
    return 2.5;
  }

  if (shorter.length < 4) return 0;

  const maxDistance = shorter.length >= 8 ? 2 : 1;
  return isEditDistanceAtMost(a, b, maxDistance) ? 1.5 : 0;
}

function productSearchText(product: Product): string {
  return [
    product.name,
    product.article,
    product.brand,
    product.categoryName,
    product.description,
    product.compatibility,
    ...product.specs.map((spec) => `${spec.label} ${spec.value}`),
  ].join(" ");
}

/**
 * Считает релевантность всех товаров запросу и возвращает только совпадения.
 * Сортировка устойчивая: при равном счёте сохраняется порядок каталога.
 */
export function findProductHits(
  products: Product[],
  query: string,
): SearchHit[] {
  const trimmed = query.trim().slice(0, MAX_SEARCH_QUERY_LENGTH);
  if (!trimmed) return [];

  const normalizedQuery = normalizeSearchText(trimmed);
  const queryTokens = tokenize(trimmed);
  const queryStems = queryTokens.map(stemWord);
  const articleQuery = normalizeArticle(trimmed);
  const hits: SearchHit[] = [];

  for (const product of products) {
    const haystack = productSearchText(product);
    const normalizedHaystack = normalizeSearchText(haystack);
    const productTokens = tokenize(haystack);
    const productStems = productTokens.map(stemWord);

    const exactArticle =
      articleQuery.length >= 2 &&
      normalizeArticle(product.article).includes(articleQuery);

    let score = exactArticle ? 10 : 0;
    let matchedAll = exactArticle;

    if (
      normalizedQuery.length >= 2 &&
      normalizedHaystack.includes(normalizedQuery)
    ) {
      score += 6;
      matchedAll = true;
    }

    let matchedTokens = 0;

    for (let queryIndex = 0; queryIndex < queryTokens.length; queryIndex += 1) {
      let best = 0;

      for (
        let productIndex = 0;
        productIndex < productTokens.length;
        productIndex += 1
      ) {
        if (queryTokens[queryIndex] === productTokens[productIndex]) {
          best = 4;
          break;
        }

        best = Math.max(
          best,
          stemMatchScore(queryStems[queryIndex], productStems[productIndex]),
        );
      }

      if (best > 0) {
        matchedTokens += 1;
        score += best;
      }
    }

    if (queryTokens.length > 0 && matchedTokens === queryTokens.length) {
      matchedAll = true;
    }

    if (score <= 0) continue;

    hits.push({ product, score, matchedAll, exactArticle });
  }

  return hits.sort((left, right) => right.score - left.score);
}

/**
 * Обычная выдача: если есть товары, совпавшие по всем словам, показываем
 * только их; иначе — частичные совпадения как запасной вариант.
 */
export function selectResults(hits: SearchHit[]): Product[] {
  if (hits.length === 0) return [];

  const fullMatches = hits.filter((hit) => hit.matchedAll);
  return (fullMatches.length > 0 ? fullMatches : hits).map(
    (hit) => hit.product,
  );
}

/** ИИ нужен только тогда, когда локальный поиск не нашёл полного совпадения. */
export function needsAi(hits: SearchHit[]): boolean {
  return hits.length === 0 || !hits.some((hit) => hit.matchedAll);
}

/** До 20 лучших совпадений; если их меньше — добираем остальной каталог. */
export function topCandidates(
  hits: SearchHit[],
  products: Product[],
  limit = MAX_AI_CANDIDATES,
): Product[] {
  const candidates: Product[] = [];
  const seen = new Set<string>();

  for (const hit of hits) {
    if (candidates.length >= limit) break;
    if (seen.has(hit.product.id)) continue;

    seen.add(hit.product.id);
    candidates.push(hit.product);
  }

  for (const product of products) {
    if (candidates.length >= limit) break;
    if (seen.has(product.id)) continue;

    seen.add(product.id);
    candidates.push(product);
  }

  return candidates;
}
