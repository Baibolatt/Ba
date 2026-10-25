import type { Order, OrderStatus, Product, StockLevel } from "@/lib/types";

export const orderStatusLabels: Record<OrderStatus, string> = {
  new: "Новая",
  in_progress: "В работе",
  done: "Выполнена",
};

export function formatPrice(value: number): string {
  return `${new Intl.NumberFormat("ru-RU").format(value)} ₸`;
}

export function productCountLabel(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  const word =
    mod10 === 1 && mod100 !== 11
      ? "товар"
      : mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)
        ? "товара"
        : "товаров";
  return `${count} ${word}`;
}

export function stockLevel(product: Pick<Product, "quantity">): StockLevel {
  if (product.quantity <= 0) return "out";
  if (product.quantity <= 3) return "low";
  return "in";
}

export function orderItemsCount(order: Pick<Order, "items">): number {
  return order.items.reduce((sum, item) => sum + item.qty, 0);
}
