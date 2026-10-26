import { getProducts } from "@/lib/data";
import { findMatchingArticles, hasDeepSeekKey } from "@/lib/deepseek";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  findProductHits,
  needsAi,
  selectResults,
  topCandidates,
} from "@/lib/search-match";
import type { Product } from "@/lib/types";

const AI_RATE_LIMIT = 10;
const AI_RATE_WINDOW_MS = 60_000;

export type SmartSearchResult = {
  products: Product[];
  /** Модель действительно исправила запрос и вернула подходящие товары. */
  usedAi: boolean;
};

/**
 * Двухступенчатый поиск: сначала локальный по каталогу. DeepSeek вызывается
 * только если ни один товар не совпал по всем словам запроса, ключ задан и
 * лимит с адреса не исчерпан.
 */
export async function searchProductsSmart(
  query: string,
  address: string,
): Promise<SmartSearchResult> {
  const trimmed = query.trim();
  if (!trimmed) return { products: [], usedAi: false };

  const products = await getProducts();
  const hits = findProductHits(products, trimmed);
  const direct = selectResults(hits);

  if (!needsAi(hits) || products.length === 0) {
    return { products: direct, usedAi: false };
  }

  if (!hasDeepSeekKey()) {
    return { products: direct, usedAi: false };
  }

  const limit = checkRateLimit(
    `ai-search:${address}`,
    AI_RATE_LIMIT,
    AI_RATE_WINDOW_MS,
  );
  if (!limit.allowed) {
    return { products: direct, usedAi: false };
  }

  const candidates = topCandidates(hits, products);
  if (candidates.length === 0) {
    return { products: direct, usedAi: false };
  }

  const articles = await findMatchingArticles(trimmed, candidates);
  if (!articles || articles.length === 0) {
    return { products: direct, usedAi: false };
  }

  const byArticle = new Map(
    candidates.map((product) => [product.article, product]),
  );
  const productsByAi: Product[] = [];

  for (const article of articles) {
    const product = byArticle.get(article);
    if (product) productsByAi.push(product);
  }

  if (productsByAi.length === 0) {
    return { products: direct, usedAi: false };
  }

  return { products: productsByAi, usedAi: true };
}
