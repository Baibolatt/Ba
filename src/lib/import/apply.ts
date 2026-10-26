import type { PrismaClient } from "../../generated/prisma/client";
import { cleanText, normalizeArticle, normalizeEntityName } from "./clean";
import type { CatalogSnapshot } from "./snapshot";
import type { ImportPlan, PreparedProduct } from "./types";

export type ImportCaches = {
  brandIds: Map<string, string>;
  categoryIds: Map<string, string>;
};

const TRANSLIT: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "g",
  д: "d",
  е: "e",
  ё: "e",
  ж: "zh",
  з: "z",
  и: "i",
  й: "y",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "h",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "sch",
  ъ: "",
  ы: "y",
  ь: "",
  э: "e",
  ю: "yu",
  я: "ya",
  ә: "a",
  ғ: "g",
  қ: "k",
  ң: "n",
  ө: "o",
  ұ: "u",
  ү: "u",
  һ: "h",
  і: "i",
};

function shortHash(value: string): string {
  let hash = 5381;
  for (let index = 0; index < value.length; index += 1) {
    hash = ((hash << 5) + hash + value.charCodeAt(index)) >>> 0;
  }
  return hash.toString(36);
}

function makeUniqueSlug(
  name: string,
  usedSlugs: Set<string>,
): string {
  const transliterated = [...cleanText(name)]
    .map((char) => TRANSLIT[char] ?? char)
    .join("")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");

  let base = transliterated
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!base) base = `category-${shortHash(name)}`;

  let slug = base;
  let suffix = 2;

  while (usedSlugs.has(slug)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  usedSlugs.add(slug);
  return slug;
}

/**
 * Создаёт отсутствующие бренды и категории. Возвращает карты «имя → id»,
 * по которым пакетная запись находит связи товара.
 */
export async function ensureImportEntities(
  prisma: PrismaClient,
  plan: ImportPlan,
  snapshot: CatalogSnapshot,
): Promise<ImportCaches> {
  const brandIds = new Map<string, string>();
  const categoryIds = new Map<string, string>();

  // Сначала переносим уже существующие связи.
  for (const brand of snapshot.brands) {
    brandIds.set(normalizeEntityName(brand.name), brand.id);
  }
  for (const category of snapshot.categories) {
    categoryIds.set(normalizeEntityName(category.name), category.id);
    categoryIds.set(normalizeEntityName(category.slug), category.id);
  }

  const brandNames = new Map<string, string>();
  for (const name of plan.newBrands) {
    brandNames.set(normalizeEntityName(name), name);
  }
  if (plan.fallbackBrand) {
    brandNames.set(normalizeEntityName(plan.fallbackBrand), plan.fallbackBrand);
  }

  for (const [key, name] of brandNames) {
    const existingId = brandIds.get(key);
    if (existingId) continue;

    const created = await prisma.brand.create({ data: { name } });
    brandIds.set(key, created.id);
  }

  const categoryNames = new Map<string, string>();
  for (const name of plan.newCategories) {
    categoryNames.set(normalizeEntityName(name), name);
  }
  if (plan.fallbackCategory) {
    categoryNames.set(
      normalizeEntityName(plan.fallbackCategory),
      plan.fallbackCategory,
    );
  }

  const usedSlugs = new Set(snapshot.categorySlugs);

  for (const [key, name] of categoryNames) {
    const existingId = categoryIds.get(key);
    if (existingId) continue;

    const created = await prisma.category.create({
      data: {
        slug: makeUniqueSlug(name, usedSlugs),
        name,
        shortName: name,
        description: "",
        icon: "gear",
        sortOrder: 0,
      },
    });
    categoryIds.set(key, created.id);
  }

  return { brandIds, categoryIds };
}

/** Записывает один пакет товаров в одной транзакции. */
export async function applyImportBatch(
  prisma: PrismaClient,
  records: PreparedProduct[],
  caches: ImportCaches,
): Promise<{ added: number; updated: number }> {
  if (records.length === 0) return { added: 0, updated: 0 };

  let added = 0;
  let updated = 0;

  await prisma.$transaction(
    async (tx) => {
      for (const record of records) {
        const brandId = record.brandName
          ? caches.brandIds.get(normalizeEntityName(record.brandName))
          : undefined;
        const categoryId = record.categoryName
          ? caches.categoryIds.get(normalizeEntityName(record.categoryName))
          : undefined;

        if (record.existingId) {
          const data = {
            name: record.name,
            price: record.price,
            ...(record.quantity !== null
              ? { quantity: record.quantity }
              : {}),
            ...(record.unit !== null ? { unit: record.unit } : {}),
            ...(record.compatibility !== null
              ? { compatibility: record.compatibility }
              : {}),
            ...(brandId ? { brandId } : {}),
            ...(categoryId ? { categoryId } : {}),
          };

          await tx.product.update({
            where: { id: record.existingId },
            data,
          });
          updated += 1;
          continue;
        }

        if (!brandId || !categoryId) {
          throw new Error(
            `Не найден бренд или категория для артикула ${record.article}`,
          );
        }

        await tx.product.create({
          data: {
            article: record.article,
            name: record.name,
            price: record.price,
            quantity: record.quantity ?? 0,
            unit: record.unit ?? "шт.",
            compatibility: record.compatibility ?? "",
            description: "",
            brandId,
            categoryId,
          },
        });
        added += 1;
      }
    },
    { timeout: 60_000 },
  );

  return { added, updated };
}

/** Обнуляет остаток у товаров, которых не было в последнем импорте. */
export async function resetMissingStock(
  prisma: PrismaClient,
  keptKeys: Set<string>,
): Promise<number> {
  const products = await prisma.product.findMany({
    select: { id: true, article: true },
  });

  const missingIds = products
    .filter((product) => !keptKeys.has(normalizeArticle(product.article)))
    .map((product) => product.id);

  const batchSize = 500;

  for (let offset = 0; offset < missingIds.length; offset += batchSize) {
    const batch = missingIds.slice(offset, offset + batchSize);
    await prisma.product.updateMany({
      where: { id: { in: batch } },
      data: { quantity: 0 },
    });
  }

  return missingIds.length;
}
