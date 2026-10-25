"use client";

import { useState } from "react";
import type { Product } from "@/lib/mock-data";
import { QuantityStepper } from "@/components/catalog/quantity-stepper";
import { AddToCartButton } from "@/components/catalog/add-to-cart-button";
import { FavoriteButton } from "@/components/catalog/favorite-button";
import { Icon } from "@/components/ui/icon";

type ProductPurchaseProps = {
  product: Product;
};

export function ProductPurchase({ product }: ProductPurchaseProps) {
  const [qty, setQty] = useState(1);
  const outOfStock = product.stock <= 0;

  return (
    <div className="space-y-2.5">
      <div className="flex gap-2">
        <QuantityStepper
          value={qty}
          onChange={setQty}
          max={outOfStock ? 1 : Math.min(99, product.stock)}
        />
        <AddToCartButton
          productId={product.id}
          qty={qty}
          disabled={outOfStock}
          variant="full"
          className="flex-1"
        />
      </div>
      <FavoriteButton
        productId={product.id}
        withLabel
        className="w-full"
      />
      <p className="flex items-center gap-1.5 pt-1 text-xs text-success">
        <Icon name="truck" className="size-3.5" />
        Со склада · самовывоз сегодня
      </p>
    </div>
  );
}
