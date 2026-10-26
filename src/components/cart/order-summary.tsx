import type { ReactNode } from "react";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";

export type SummaryLine = {
  product: Product;
  qty: number;
  /** Цена на момент заказа. Если не передана, берётся текущая цена товара. */
  price?: number;
};

type OrderSummaryProps = {
  lines: SummaryLine[];
  title?: string;
  children?: ReactNode;
};

export function OrderSummary({
  lines,
  title = "Ваша заявка",
  children,
}: OrderSummaryProps) {
  const linePrice = (line: SummaryLine) => line.price ?? line.product.price;
  const total = lines.reduce(
    (sum, line) => sum + linePrice(line) * line.qty,
    0,
  );
  const count = lines.reduce((sum, line) => sum + line.qty, 0);

  return (
    <aside className="rounded-card border border-line bg-surface p-4 shadow-card lg:sticky lg:top-24">
      <h2 className="text-base font-bold text-ink">{title}</h2>

      <ul className="mt-3 space-y-2.5">
        {lines.map((line) => (
          <li
            key={line.product.id}
            className="flex items-start justify-between gap-3 text-sm"
          >
            <span className="min-w-0 flex-1 text-muted">
              <span className="line-clamp-1 text-ink">{line.product.name}</span>
              <span className="text-xs">
                {line.qty} × {formatPrice(linePrice(line))}
              </span>
            </span>
            <span className="shrink-0 font-medium text-ink">
              {formatPrice(linePrice(line) * line.qty)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">Позиции ({count})</dt>
          <dd className="font-medium text-ink">{formatPrice(total)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3">
          <dt className="text-muted">Получение</dt>
          <dd className="font-medium text-ink">Со склада или по области</dd>
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-line pt-3 text-base">
          <dt className="font-bold text-ink">Итого</dt>
          <dd className="font-bold text-brand">{formatPrice(total)}</dd>
        </div>
      </dl>

      {children ? <div className="mt-4">{children}</div> : null}
    </aside>
  );
}
