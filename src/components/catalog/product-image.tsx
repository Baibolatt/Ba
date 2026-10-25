import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/ui/icon";
import type { CategorySlug, Product } from "@/lib/mock-data";

const categoryIcons: Record<CategorySlug, IconName> = {
  brakes: "brake",
  filters: "filter",
  oils: "droplet",
  engine: "gear",
  suspension: "spring",
  electric: "battery",
};

type ProductImageProps = {
  product: Product;
  className?: string;
};

export function ProductImage({ product, className }: ProductImageProps) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-control bg-gradient-to-br from-brand-50 via-surface to-page ring-1 ring-inset ring-line/70",
        className,
      )}
    >
      <Icon
        name={categoryIcons[product.categorySlug]}
        className="size-1/3 max-h-20 min-h-8 text-brand/35"
        strokeWidth={1.2}
      />
      <span className="absolute bottom-2 right-2.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-muted/50">
        PartsHub
      </span>
    </div>
  );
}
