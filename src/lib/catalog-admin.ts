import { prisma } from "@/lib/db";
import { categoryIcons } from "@/lib/category-icons";
import {
  cleanText,
  normalizeEntityName,
} from "@/lib/import/clean";
import { makeUniqueSlug } from "@/lib/slug";
import type { CategoryIcon } from "@/lib/types";

export type CatalogActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

function parseSortOrder(value: unknown): number | null {
  const text = String(value ?? "").trim();
  if (!text) return 0;

  const number = Number(text);
  return Number.isInteger(number) && number >= 0 && number <= 10_000
    ? number
    : null;
}

function isCategoryIcon(value: string): value is CategoryIcon {
  return categoryIcons.includes(value as CategoryIcon);
}

async function brandNameIsTaken(
  name: string,
  excludeId?: string,
): Promise<boolean> {
  const key = normalizeEntityName(name);
  const brands = await prisma.brand.findMany({
    select: { id: true, name: true },
  });

  return brands.some(
    (brand) =>
      brand.id !== excludeId && normalizeEntityName(brand.name) === key,
  );
}

export async function saveBrand(
  nameInput: unknown,
  brandId?: string,
): Promise<CatalogActionResult> {
  const name = cleanText(nameInput).slice(0, 100);

  if (name.length < 2) {
    return { ok: false, error: "Название бренда — минимум 2 символа" };
  }

  if (await brandNameIsTaken(name, brandId)) {
    return { ok: false, error: "Бренд с таким названием уже есть" };
  }

  if (brandId) {
    const existing = await prisma.brand.findUnique({
      where: { id: brandId },
      select: { id: true },
    });
    if (!existing) return { ok: false, error: "Бренд не найден" };
  }

  try {
    if (brandId) {
      await prisma.brand.update({ where: { id: brandId }, data: { name } });
      return { ok: true, message: "Бренд переименован" };
    }

    await prisma.brand.create({ data: { name } });
    return { ok: true, message: "Бренд добавлен" };
  } catch {
    return { ok: false, error: "Не удалось сохранить бренд" };
  }
}

export async function deleteBrand(
  brandId: string,
): Promise<CatalogActionResult> {
  const brand = await prisma.brand.findUnique({
    where: { id: brandId },
    select: { id: true, _count: { select: { products: true } } },
  });

  if (!brand) return { ok: false, error: "Бренд не найден" };

  if (brand._count.products > 0) {
    return {
      ok: false,
      error:
        "У бренда есть товары. Сначала перенесите их на другой бренд, затем удалите.",
    };
  }

  try {
    await prisma.brand.delete({ where: { id: brandId } });
    return { ok: true, message: "Бренд удалён" };
  } catch {
    return { ok: false, error: "Не удалось удалить бренд" };
  }
}

export type CategoryInput = {
  name: unknown;
  shortName: unknown;
  description: unknown;
  icon: unknown;
  sortOrder: unknown;
};

async function categoryNameIsTaken(
  name: string,
  excludeId?: string,
): Promise<boolean> {
  const key = normalizeEntityName(name);
  const categories = await prisma.category.findMany({
    select: { id: true, name: true },
  });

  return categories.some(
    (category) =>
      category.id !== excludeId &&
      normalizeEntityName(category.name) === key,
  );
}

export async function saveCategory(
  input: CategoryInput,
  categoryId?: string,
): Promise<CatalogActionResult> {
  const name = cleanText(input.name).slice(0, 100);
  if (name.length < 2) {
    return { ok: false, error: "Название категории — минимум 2 символа" };
  }

  const shortName = cleanText(input.shortName).slice(0, 40) || name;
  const description = cleanText(input.description).slice(0, 1000);
  const icon = cleanText(input.icon);
  const sortOrder = parseSortOrder(input.sortOrder);

  if (!isCategoryIcon(icon)) {
    return { ok: false, error: "Выберите иконку категории" };
  }

  if (sortOrder === null) {
    return {
      ok: false,
      error: "Порядок сортировки — целое число от 0 до 10000",
    };
  }

  if (await categoryNameIsTaken(name, categoryId)) {
    return { ok: false, error: "Категория с таким названием уже есть" };
  }

  if (categoryId) {
    const existing = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { id: true },
    });
    if (!existing) return { ok: false, error: "Категория не найдена" };
  }

  try {
    if (categoryId) {
      await prisma.category.update({
        where: { id: categoryId },
        data: { name, shortName, description, icon, sortOrder },
      });
      return { ok: true, message: "Категория сохранена" };
    }

    const categories = await prisma.category.findMany({
      select: { slug: true },
    });

    await prisma.category.create({
      data: {
        slug: makeUniqueSlug(
          name,
          new Set(categories.map((category) => category.slug)),
        ),
        name,
        shortName,
        description,
        icon,
        sortOrder,
      },
    });

    return { ok: true, message: "Категория добавлена" };
  } catch {
    return { ok: false, error: "Не удалось сохранить категорию" };
  }
}

export async function deleteCategory(
  categoryId: string,
): Promise<CatalogActionResult> {
  const category = await prisma.category.findUnique({
    where: { id: categoryId },
    select: { id: true, _count: { select: { products: true } } },
  });

  if (!category) return { ok: false, error: "Категория не найдена" };

  if (category._count.products > 0) {
    return {
      ok: false,
      error:
        "В категории есть товары. Сначала перенесите их в другую категорию.",
    };
  }

  try {
    await prisma.category.delete({ where: { id: categoryId } });
    return { ok: true, message: "Категория удалена" };
  } catch {
    return { ok: false, error: "Не удалось удалить категорию" };
  }
}
