"use client";

import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";
import { useStore } from "@/components/providers/store-provider";

type AddToCartButtonProps = {
  productId: string;
  qty?: number;
  disabled?: boolean;
  variant?: "icon" | "full";
  className?: string;
};

export function AddToCartButton({
  productId,
  qty = 1,
  disabled = false,
  variant = "icon",
  className,
}: AddToCartButtonProps) {
  const { addToCart } = useStore();

  if (variant === "full") {
    return (
      <button
        type="button"
        disabled={disabled}
        onClick={() => addToCart(productId, qty)}
        className={cn(
          "inline-flex h-12 w-full items-center justify-center gap-2 rounded-control bg-brand px-5 text-sm font-bold text-white transition-colors hover:bg-brand-800 disabled:pointer-events-none disabled:bg-page disabled:text-muted",
          className,
        )}
      >
        <Icon name="cart" className="size-4" />
        {disabled ? "Нет в наличии" : "В заявку"}
      </button>
    );
  }

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => addToCart(productId, qty)}
      aria-label="Добавить в заявку"
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-control bg-brand text-white transition-colors hover:bg-brand-800 disabled:pointer-events-none disabled:bg-page disabled:text-muted",
        className,
      )}
    >
      <Icon name="cart" className="size-4" />
    </button>
  );
}
