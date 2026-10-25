import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { formatPrice } from "@/lib/format";
import type { Product } from "@/lib/types";
import { ProductImage } from "@/components/catalog/product-image";

type CartItemProps = {
  product: Product;
  qty: number;
  unitPrice?: number;
  actions?: ReactNode;
  compact?: boolean;
  className?: string;
};

export function CartItem({
  product,
  qty,
  unitPrice,
  actions,
  compact = false,
  className,
}: CartItemProps) {
  const price = unitPrice ?? product.price;
  const lineTotal = price * qty;

  return (
    <article className={cn("flex gap-3 py-4 first:pt-0 last:pb-0", className)}>
      <Link
        href={`/product/${product.id}`}
        className="shrink-0"
        aria-label={product.name}
      >
        <ProductImage
          product={product}
          className={compact ? "size-16" : "size-20 sm:size-24"}
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted">
              {product.brand}
            </p>
            <Link
              href={`/product/${product.id}`}
              className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug text-ink transition-colors hover:text-brand-700"
            >
              {product.name}
            </Link>
            <p className="mt-0.5 text-[11px] text-muted">
              Арт. {product.article}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-brand">
              {formatPrice(lineTotal)}
            </p>
            {qty > 1 ? (
              <p className="mt-0.5 text-[11px] text-muted">
                {formatPrice(price)} × {qty}
              </p>
            ) : null}
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          {actions ?? (
            <span className="text-xs text-muted">{qty} шт.</span>
          )}
        </div>
      </div>
    </article>
  );
}
