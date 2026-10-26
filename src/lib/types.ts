export type CategoryIcon =
  | "brake"
  | "filter"
  | "droplet"
  | "gear"
  | "spring"
  | "battery";

export type Category = {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  description: string;
  icon: CategoryIcon;
  sortOrder: number;
  productCount: number;
};

export type BrandSummary = {
  id: string;
  name: string;
  productCount: number;
};

export type Specification = {
  label: string;
  value: string;
};

export type Product = {
  id: string;
  name: string;
  brand: string;
  article: string;
  categorySlug: string;
  categoryName: string;
  categoryIcon: CategoryIcon;
  price: number;
  oldPrice?: number;
  /** Остаток из базы (Product.quantity). */
  quantity: number;
  /** Вычисляется из остатка: quantity > 0. */
  inStock: boolean;
  unit: string;
  imageUrl?: string;
  description: string;
  compatibility: string;
  specs: Specification[];
  badge?: "Хит" | "Новинка";
};

/** Короткая карточка товара, которую ИИ-консультант возвращает в чат. */
export type AssistantProduct = {
  id: string;
  article: string;
  name: string;
  brand: string;
  price: number;
  inStock: boolean;
  quantity: number;
};

export type StockLevel = "in" | "low" | "out";

export type OrderStatus = "new" | "in_progress" | "done" | "cancelled";

export type OrderItem = {
  productId: string;
  qty: number;
  /** Цена на момент заказа, тенге. */
  price: number;
};

export type Order = {
  id: string;
  number: string;
  date: string;
  status: OrderStatus;
  items: OrderItem[];
  total: number;
  address: string;
  delivery: string;
  payment: string;
  customerName: string;
  phone: string;
  email?: string;
  comment?: string;
};

export type OrderLine = {
  product: Product;
  qty: number;
  price: number;
};

export type OrderDetail = Order & {
  lines: OrderLine[];
};

export type NotificationItem = {
  id: string;
  title: string;
  text: string;
  date: string;
  read: boolean;
  href?: string;
};

