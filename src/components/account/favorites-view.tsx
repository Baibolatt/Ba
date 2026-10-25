"use client";

import { getProduct } from "@/lib/mock-data";
import { useStore } from "@/components/providers/store-provider";
import { ProductCard } from "@/components/catalog/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export function FavoritesView() {
  const { favorites } = useStore();

  const items = favorites.flatMap((id) => {
    const product = getProduct(id);
    return product ? [product] : [];
  });

  if (items.length === 0) {
    return (
      <EmptyState
        icon="heart"
        title="В избранном пока пусто"
        description="Нажмите на сердечко в карточке товара, чтобы сохранить его здесь."
        action={<ButtonLink href="/catalog">Перейти в каталог</ButtonLink>}
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-1.5 text-xs text-muted">
          <Icon name="heart" className="size-3.5 text-icon" />
          {items.length} сохранённых товаров
        </p>
        <p className="hidden text-[11px] text-muted sm:block">
          Нажмите на сердечко, чтобы убрать товар
        </p>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {items.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
