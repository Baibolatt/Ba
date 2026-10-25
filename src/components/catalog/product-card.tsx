import Link from "next/link";
import { cn } from "@/lib/cn";
import { formatPrice, stockLevel, type Product } from "@/lib/mock-data";
import { ProductImage } from "@/components/catalog/product-image";
import { FavoriteButton } from "@/components/catalog/favorite-button";
import { AddToCartButton } from "@/components/catalog/add-to-cart-button";
import { StockBadge } from "@/components/ui/stock-badge";

type ProductCardProps = {
  product: Product;
  className?: string;
};

export function ProductCard({ product, className }: ProductCardProps) {
  const level = stockLevel(product);

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-card border border-line bg-surface shadow-card transition-shadow hover:shadow-float",
        className,
      )}
    >
      <div className="relative p-2.5 pb-0 sm:p-3">
        <Link href={`/product/${product.id}`} aria-label={product.name}>
          <ProductImage product={product} className="aspect-square" />
        </Link>
        <FavoriteButton
          productId={product.id}
          className="absolute right-3 top-3 sm:right-4 sm:top-4"
        />
        {product.badge ? (
          <span className="absolute left-3 top-3 rounded-full bg-ink px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-white sm:left-4 sm:top-4 sm:px-2.5">
            {product.badge}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col p-2.5 sm:p-3">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted">
          {product.brand}
        </p>
        <Link
          href={`/product/${product.id}`}
          className="mt-1 line-clamp-2 min-h-10 text-sm font-semibold leading-snug text-ink transition-colors hover:text-brand-700"
        >
          {product.name}
        </Link>
        <p className="mt-1 text-[11px] text-muted">Арт. {product.article}</p>

        <div className="mt-auto pt-3">
          <StockBadge level={level} stock={product.stock} className="mb-2" />
          <div className="flex items-end justify-between gap-2">
            <div>
              <p className="text-base font-bold leading-tight text-brand">
                {formatPrice(product.price)}
              </p>
              {product.oldPrice ? (
                <p className="text-[11px] text-muted line-through">
                  {formatPrice(product.oldPrice)}
                </p>
              ) : null}
            </div>
            <AddToCartButton
              productId={product.id}
              disabled={level === "out"}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
