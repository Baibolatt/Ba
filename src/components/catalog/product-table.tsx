import Link from "next/link";
import { formatPrice, stockLevel, type Product } from "@/lib/mock-data";
import { ProductImage } from "@/components/catalog/product-image";
import { AddToCartButton } from "@/components/catalog/add-to-cart-button";
import { StockBadge } from "@/components/ui/stock-badge";

type ProductTableProps = {
  products: Product[];
};

export function ProductTable({ products }: ProductTableProps) {
  return (
    <div className="overflow-x-auto rounded-card border border-line bg-surface">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line bg-page/70 text-left text-[11px] uppercase tracking-wide text-muted">
            <th scope="col" className="px-4 py-3 font-semibold">
              Товар
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Бренд
            </th>
            <th scope="col" className="px-4 py-3 font-semibold">
              Наличие
            </th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">
              Цена
            </th>
            <th scope="col" className="w-14 px-4 py-3">
              <span className="sr-only">Действие</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {products.map((product) => {
            const level = stockLevel(product);
            return (
              <tr
                key={product.id}
                className="transition-colors hover:bg-brand-50/50"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <ProductImage
                      product={product}
                      className="size-12 shrink-0"
                    />
                    <div className="min-w-0">
                      <Link
                        href={`/product/${product.id}`}
                        className="line-clamp-1 font-semibold text-ink transition-colors hover:text-brand-700"
                      >
                        {product.name}
                      </Link>
                      <p className="mt-0.5 text-[11px] text-muted">
                        Арт. {product.article}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-muted">
                  {product.brand}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StockBadge level={level} stock={product.stock} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-right">
                  <span className="font-bold text-ink">
                    {formatPrice(product.price)}
                  </span>
                  {product.oldPrice ? (
                    <span className="ml-2 text-[11px] text-muted line-through">
                      {formatPrice(product.oldPrice)}
                    </span>
                  ) : null}
                </td>
                <td className="px-4 py-3">
                  <AddToCartButton
                    productId={product.id}
                    disabled={level === "out"}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
