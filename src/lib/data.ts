import type {
  Brand,
  Category as CategoryRecord,
  Order as OrderRecord,
  OrderItem as OrderItemRecord,
  Product as ProductRecord,
  ProductSpec as ProductSpecRecord,
} from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { normalizeArticle } from "@/lib/import/clean";
import type {
  Category,
  CategoryIcon,
  Order,
  OrderDetail,
  OrderStatus,
  Product,
} from "@/lib/types";

const productInclude = {
  brand: true,
  category: true,
  specs: { orderBy: { sortOrder: "asc" } },
} as const;

type ProductWithRelations = ProductRecord & {
  brand: Brand;
  category: CategoryRecord;
  specs: ProductSpecRecord[];
};

type OrderWithItems = OrderRecord & {
  items: OrderItemRecord[];
};

const categoryIcons: CategoryIcon[] = [
  "brake",
  "filter",
  "droplet",
  "gear",
  "spring",
  "battery",
];

function toCategoryIcon(value: string): CategoryIcon {
  return categoryIcons.includes(value as CategoryIcon)
    ? (value as CategoryIcon)
    : "gear";
}

function toProductBadge(value: string | null): Product["badge"] {
  return value === "Хит" || value === "Новинка" ? value : undefined;
}

function toProduct(record: ProductWithRelations): Product {
  return {
    id: record.id,
    name: record.name,
    brand: record.brand.name,
    article: record.article,
    categorySlug: record.category.slug,
    categoryName: record.category.name,
    categoryIcon: toCategoryIcon(record.category.icon),
    price: record.price,
    oldPrice: record.oldPrice ?? undefined,
    quantity: record.quantity,
    inStock: record.quantity > 0,
    unit: record.unit,
    imageUrl: record.imageUrl ?? undefined,
    description: record.description,
    compatibility: record.compatibility,
    specs: record.specs.map((spec) => ({
      label: spec.label,
      value: spec.value,
    })),
    badge: toProductBadge(record.badge),
  };
}

function toCategory(record: CategoryRecord, productCount: number): Category {
  return {
    id: record.id,
    slug: record.slug,
    name: record.name,
    shortName: record.shortName,
    description: record.description,
    icon: toCategoryIcon(record.icon),
    productCount,
  };
}

function toOrderStatus(value: string): OrderStatus {
  return value === "new" || value === "in_progress" || value === "done"
    ? value
    : "new";
}

function formatOrderDate(date: Date): string {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function toOrder(record: OrderWithItems): Order {
  const items = record.items.map((item) => ({
    productId: item.productId,
    qty: item.quantity,
    price: item.price,
  }));

  return {
    id: record.id,
    number: record.number,
    date: formatOrderDate(record.createdAt),
    status: toOrderStatus(record.status),
    items,
    total: items.reduce((sum, item) => sum + item.price * item.qty, 0),
    address: record.address ?? "Самовывоз со склада, Тараз",
    delivery: record.deliveryMethod === "pickup" ? "Самовывоз" : "Курьером",
    payment: record.payment ?? "При получении",
    customerName: record.customerName,
    phone: record.phone,
    comment: record.comment ?? undefined,
  };
}

export async function getCategories(): Promise<Category[]> {
  const records = await prisma.category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { sortOrder: "asc" },
  });

  return records.map((record) =>
    toCategory(record, record._count.products),
  );
}

export async function getCategory(slug: string): Promise<Category | null> {
  const record = await prisma.category.findUnique({
    where: { slug },
    include: { _count: { select: { products: true } } },
  });

  return record ? toCategory(record, record._count.products) : null;
}

export async function getBrands(): Promise<string[]> {
  const records = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    select: { name: true },
  });

  return records.map((record) => record.name);
}

export async function getProducts(): Promise<Product[]> {
  const records = await prisma.product.findMany({
    include: productInclude,
    orderBy: { sortOrder: "asc" },
  });

  return records.map(toProduct);
}

export async function getProductsByCategory(slug: string): Promise<Product[]> {
  if (slug === "all") return getProducts();

  const records = await prisma.product.findMany({
    where: { category: { slug } },
    include: productInclude,
    orderBy: { sortOrder: "asc" },
  });

  return records.map(toProduct);
}

export async function getProduct(id: string): Promise<Product | null> {
  const record = await prisma.product.findUnique({
    where: { id },
    include: productInclude,
  });

  return record ? toProduct(record) : null;
}

export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (ids.length === 0) return [];

  const records = await prisma.product.findMany({
    where: { id: { in: ids } },
    include: productInclude,
    orderBy: { sortOrder: "asc" },
  });

  return records.map(toProduct);
}

export async function getProductIds(): Promise<string[]> {
  const records = await prisma.product.findMany({
    orderBy: { sortOrder: "asc" },
    select: { id: true },
  });

  return records.map((record) => record.id);
}

export async function getRelatedProducts(
  product: Product,
  limit = 4,
): Promise<Product[]> {
  const records = await prisma.product.findMany({
    where: {
      id: { not: product.id },
      OR: [
        { category: { slug: product.categorySlug } },
        { brand: { name: product.brand } },
      ],
    },
    include: productInclude,
    orderBy: { sortOrder: "asc" },
    take: limit,
  });

  return records.map(toProduct);
}

export async function searchProducts(query: string): Promise<Product[]> {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];

  // Артикул ищем без учёта регистра, пробелов и дефисов: «abc123» найдёт «ABC-123».
  const normalizedArticleQuery = normalizeArticle(query);

  // SQLite не умеет регистронезависимый поиск по кириллице,
  // поэтому фильтруем небольшой каталог после чтения из базы.
  const products = await getProducts();

  return products.filter((product) => {
    const haystack = [product.name, product.article, product.brand]
      .join(" ")
      .toLowerCase();

    if (haystack.includes(normalized)) return true;

    if (!normalizedArticleQuery) return false;

    return normalizeArticle(product.article).includes(
      normalizedArticleQuery,
    );
  });
}

export async function getOrders(): Promise<Order[]> {
  const records = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });

  return records.map(toOrder);
}

export async function getOrder(id: string): Promise<OrderDetail | null> {
  const record = await prisma.order.findUnique({
    where: { id },
    include: {
      items: {
        include: { product: { include: productInclude } },
        orderBy: { id: "asc" },
      },
    },
  });

  if (!record) return null;

  return {
    ...toOrder(record),
    lines: record.items.map((item) => ({
      product: toProduct(item.product),
      qty: item.quantity,
      price: item.price,
    })),
  };
}

export async function getOrderIds(): Promise<string[]> {
  const records = await prisma.order.findMany({
    select: { id: true },
    orderBy: { createdAt: "desc" },
  });

  return records.map((record) => record.id);
}
