import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import {
  cleanText,
  displayArticle,
  normalizeArticle,
  normalizeEntityName,
} from "@/lib/import/clean";
import { deleteProductImage } from "@/lib/product-image";
import { makeUniqueSlug } from "@/lib/slug";

const MAX_PRICE = 100_000_000;
const MAX_QUANTITY = 1_000_000;
const badges = ["", "Хит", "Новинка"] as const;

export type ProductInput = {
  article: unknown;
  name: unknown;
  brandName: unknown;
  categoryName: unknown;
  price: unknown;
  oldPrice: unknown;
  quantity: unknown;
  unit: unknown;
  description: unknown;
  compatibility: unknown;
  badge: unknown;
};

export type SaveProductResult =
  | { ok: true; id: string; created: boolean; message: string }
  | { ok: false; error: string };

function parseInteger(
  value: unknown,
  min: number,
  max: number,
): number | null {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const number = Number(text);
  return Number.isInteger(number) && number >= min && number <= max
    ? number
    : null;
}

type ValidatedProduct = {
  article: string;
  name: string;
  brandName: string;
  categoryName: string;
  price: number;
  oldPrice: number | null;
  quantity: number;
  unit: string;
  description: string;
  compatibility: string;
  badge: string | null;
};

function validate(input: ProductInput): ValidatedProduct | string {
  const article = displayArticle(input.article).slice(0, 60);
  const name = cleanText(input.name).slice(0, 200);
  const brandName = cleanText(input.brandName).slice(0, 100);
  const categoryName = cleanText(input.categoryName).slice(0, 100);
  const unit = cleanText(input.unit).slice(0, 20) || "шт.";
  const description = cleanText(input.description).slice(0, 5000);
  const compatibility = cleanText(input.compatibility).slice(0, 500);
  const badge = cleanText(input.badge);

  if (article.length < 2) {
    return "Укажите артикул (минимум 2 символа)";
  }
  if (name.length < 2) {
    return "Укажите название товара (минимум 2 символа)";
  }
  if (!brandName) return "Укажите бренд";
  if (!categoryName) return "Укажите категорию";

  const price = parseInteger(input.price, 0, MAX_PRICE);
  if (price === null) {
    return "Цена должна быть целым неотрицательным числом";
  }

  const rawOldPrice = String(input.oldPrice ?? "").trim();
  const oldPrice = rawOldPrice
    ? parseInteger(input.oldPrice, 0, MAX_PRICE)
    : null;
  if (rawOldPrice && oldPrice === null) {
    return "Старая цена должна быть целым неотрицательным числом";
  }

  const quantity = parseInteger(input.quantity, 0, MAX_QUANTITY);
  if (quantity === null) {
    return "Остаток должен быть целым неотрицательным числом";
  }

  if (!badges.includes(badge as (typeof badges)[number])) {
    return "Некорректная метка товара";
  }

  return {
    article,
    name,
    brandName,
    categoryName,
    price,
    oldPrice,
    quantity,
    unit,
    description,
    compatibility,
    badge: badge || null,
  };
}

async function resolveBrand(
  tx: Prisma.TransactionClient,
  name: string,
): Promise<string> {
  const key = normalizeEntityName(name);
  const brands = await tx.brand.findMany({
    select: { id: true, name: true },
  });
  const existing = brands.find(
    (brand) => normalizeEntityName(brand.name) === key,
  );
  if (existing) return existing.id;

  const created = await tx.brand.create({ data: { name } });
  return created.id;
}

async function resolveCategory(
  tx: Prisma.TransactionClient,
  name: string,
): Promise<string> {
  const key = normalizeEntityName(name);
  const categories = await tx.category.findMany({
    select: { id: true, name: true, slug: true },
  });
  const existing = categories.find(
    (category) => normalizeEntityName(category.name) === key,
  );
  if (existing) return existing.id;

  const created = await tx.category.create({
    data: {
      slug: makeUniqueSlug(
        name,
        new Set(categories.map((category) => category.slug)),
      ),
      name,
      shortName: name,
      description: "",
      icon: "gear",
      sortOrder: 0,
    },
  });
  return created.id;
}

/**
 * Создаёт или обновляет товар. Новые бренд и категория создаются по имени:
 * так одну позицию можно добавить без импорта прайс-листа.
 */
export async function saveProduct(
  input: ProductInput,
  productId?: string,
): Promise<SaveProductResult> {
  const validated = validate(input);
  if (typeof validated === "string") {
    return { ok: false, error: validated };
  }

  if (productId) {
    const existing = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true },
    });
    if (!existing) return { ok: false, error: "Товар не найден" };
  }

  const articleKey = normalizeArticle(validated.article);
  const sameArticle = await prisma.product.findMany({
    select: { id: true, article: true },
  });
  const duplicate = sameArticle.find(
    (product) =>
      product.id !== productId &&
      normalizeArticle(product.article) === articleKey,
  );
  if (duplicate) {
    return { ok: false, error: "Товар с таким артикулом уже есть" };
  }

  try {
    const id = await prisma.$transaction(async (tx) => {
      const brandId = await resolveBrand(tx, validated.brandName);
      const categoryId = await resolveCategory(tx, validated.categoryName);

      const data = {
        article: validated.article,
        name: validated.name,
        brandId,
        categoryId,
        price: validated.price,
        oldPrice: validated.oldPrice,
        quantity: validated.quantity,
        unit: validated.unit,
        description: validated.description,
        compatibility: validated.compatibility,
        badge: validated.badge,
      };

      if (productId) {
        await tx.product.update({ where: { id: productId }, data });
        return productId;
      }

      const created = await tx.product.create({ data });
      return created.id;
    });

    return {
      ok: true,
      id,
      created: !productId,
      message: productId ? "Товар сохранён" : "Товар создан",
    };
  } catch {
    return { ok: false, error: "Не удалось сохранить товар" };
  }
}

export type DeleteProductResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

/** Удаляет товар, если он не используется в заказах; фото удаляется с диска. */
export async function deleteProduct(
  productId: string,
): Promise<DeleteProductResult> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      imageUrl: true,
      _count: { select: { orderItems: true } },
    },
  });

  if (!product) return { ok: false, error: "Товар не найден" };

  if (product._count.orderItems > 0) {
    return {
      ok: false,
      error:
        "Товар уже есть в заказах, поэтому удалить его нельзя. Поставьте остаток 0, чтобы скрыть из наличия.",
    };
  }

  try {
    await prisma.product.delete({ where: { id: productId } });
  } catch {
    return { ok: false, error: "Не удалось удалить товар" };
  }

  await deleteProductImage(product.imageUrl);

  return { ok: true, message: "Товар удалён" };
}
