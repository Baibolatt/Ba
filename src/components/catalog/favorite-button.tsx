"use client";

import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";
import { useStore } from "@/components/providers/store-provider";

type FavoriteButtonProps = {
  productId: string;
  className?: string;
  withLabel?: boolean;
};

export function FavoriteButton({
  productId,
  className,
  withLabel = false,
}: FavoriteButtonProps) {
  const { isFavorite, toggleFavorite } = useStore();
  const active = isFavorite(productId);

  if (withLabel) {
    return (
      <button
        type="button"
        onClick={() => toggleFavorite(productId)}
        aria-pressed={active}
        className={cn(
          "inline-flex h-11 items-center justify-center gap-2 rounded-control border px-4 text-sm font-semibold transition-colors",
          active
            ? "border-accent bg-accent-soft text-brand"
            : "border-line-strong bg-surface text-ink hover:bg-brand-50",
          className,
        )}
      >
        <Icon
          name="heart"
          className={cn("size-4", active && "fill-accent text-accent")}
        />
        {active ? "В избранном" : "В избранное"}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(productId)}
      aria-pressed={active}
      aria-label={active ? "Убрать из избранного" : "Добавить в избранное"}
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-surface/95 text-muted shadow-sm ring-1 ring-line/80 backdrop-blur transition-colors hover:text-brand",
        active && "text-accent",
        className,
      )}
    >
      <Icon
        name="heart"
        className={cn("size-4", active && "fill-accent text-accent")}
      />
    </button>
  );
}
