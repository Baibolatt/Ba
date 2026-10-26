import type { PrismaClient } from "../../generated/prisma/client";
import { normalizeArticle, normalizeEntityName } from "./clean";

export type SnapshotProduct = {
  id: string;
  article: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  compatibility: string;
  brandId: string;
  categoryId: string;
};

export type SnapshotBrand = { id: string; name: string };
export type SnapshotCategory = { id: string; slug: string; name: string };

export type CatalogSnapshot = {
  products: SnapshotProduct[];
  brands: SnapshotBrand[];
  categories: SnapshotCategory[];
  productByKey: Map<string, SnapshotProduct>;
  brandByName: Map<string, SnapshotBrand>;
  categoryByName: Map<string, SnapshotCategory>;
  categorySlugs: Set<string>;
};

export function buildCatalogSnapshot(
  products: SnapshotProduct[],
  brands: SnapshotBrand[],
  categories: SnapshotCategory[],
): CatalogSnapshot {
  const productByKey = new Map<string, SnapshotProduct>();
  for (const product of products) {
    const key = normalizeArticle(product.article);
    if (key && !productByKey.has(key)) {
      productByKey.set(key, product);
    }
  }

  const brandByName = new Map<string, SnapshotBrand>();
  for (const brand of brands) {
    brandByName.set(normalizeEntityName(brand.name), brand);
  }

  const categoryByName = new Map<string, SnapshotCategory>();
  for (const category of categories) {
    categoryByName.set(normalizeEntityName(category.name), category);
    categoryByName.set(normalizeEntityName(category.slug), category);
  }

  return {
    products,
    brands,
    categories,
    productByKey,
    brandByName,
    categoryByName,
    categorySlugs: new Set(categories.map((category) => category.slug)),
  };
}

export async function loadCatalogSnapshot(
  prisma: PrismaClient,
): Promise<CatalogSnapshot> {
  const [products, brands, categories] = await Promise.all([
    prisma.product.findMany({
      select: {
        id: true,
        article: true,
        name: true,
        price: true,
        quantity: true,
        unit: true,
        compatibility: true,
        brandId: true,
        categoryId: true,
      },
    }),
    prisma.brand.findMany({ select: { id: true, name: true } }),
    prisma.category.findMany({
      select: { id: true, slug: true, name: true },
    }),
  ]);

  return buildCatalogSnapshot(products, brands, categories);
}
