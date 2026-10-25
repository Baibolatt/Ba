import Link from "next/link";
import { cn } from "@/lib/cn";
import { productCountLabel, type Category } from "@/lib/mock-data";
import { Icon, type IconName } from "@/components/ui/icon";

const categoryIcons: Record<Category["icon"], IconName> = {
  brake: "brake",
  filter: "filter",
  droplet: "droplet",
  gear: "gear",
  spring: "spring",
  battery: "battery",
};

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
        <Icon name={categoryIcons[category.icon]} className="size-5" />
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
