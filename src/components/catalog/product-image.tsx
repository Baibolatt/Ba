import Image from "next/image";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";
import type { Product } from "@/lib/types";

type ProductImageProps = {
  product: Product;
  className?: string;
};

export function ProductImage({ product, className }: ProductImageProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-control bg-gradient-to-br from-tint via-surface to-page ring-1 ring-inset ring-line/70",
        className,
      )}
    >
      {product.imageUrl ? (
        <Image
          src={product.imageUrl}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 300px"
          className="object-cover"
        />
      ) : (
        <>
          <Icon
            name={product.categoryIcon}
            className="size-1/3 max-h-20 min-h-8 text-muted/40"
            strokeWidth={1.2}
          />
          <span className="absolute bottom-2 right-2.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted/50">
            PartsHub
          </span>
        </>
      )}
    </div>
  );
}
