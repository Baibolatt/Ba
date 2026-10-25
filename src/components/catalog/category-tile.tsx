import Link from "next/link";
import { cn } from "@/lib/cn";
import { productCountLabel } from "@/lib/format";
import type { Category } from "@/lib/types";
import { Icon } from "@/components/ui/icon";

type CategoryTileProps = {
  category: Category;
  count: number;
  className?: string;
  compact?: boolean;
};

export function CategoryTile({
  category,
  count,
  className,
  compact = false,
}: CategoryTileProps) {
  return (
    <Link
      href={`/catalog/${category.slug}`}
      className={cn(
        "group flex items-center gap-3 rounded-card border border-line bg-surface p-3.5 shadow-card transition-colors hover:border-brand/30 hover:bg-tint/30",
        className,
      )}
    >
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-control bg-tint text-icon transition-colors group-hover:bg-brand group-hover:text-white",
          compact ? "size-10" : "size-11",
        )}
      >
        <Icon name={category.icon} className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-ink">
          {category.name}
        </span>
        <span className="mt-0.5 block truncate text-xs text-muted">
          {productCountLabel(count)}
        </span>
      </span>
      <Icon
        name="chevronRight"
        className="size-4 shrink-0 text-line-strong transition-colors group-hover:text-brand"
      />
    </Link>
  );
}
