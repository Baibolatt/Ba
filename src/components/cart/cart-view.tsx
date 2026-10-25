"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import type { Product } from "@/lib/types";
import { useStore } from "@/components/providers/store-provider";
import { CartItem } from "@/components/cart/cart-item";
import { QuantityStepper } from "@/components/catalog/quantity-stepper";
import { OrderSummary } from "@/components/cart/order-summary";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";

export function CartView({ products }: { products: Product[] }) {
  const { cart, cartCount, setQty, removeFromCart, clearCart } = useStore();
  const [promo, setPromo] = useState("");
  const [promoMessage, setPromoMessage] = useState<string | null>(null);

  const lines = cart.flatMap((line) => {
    const product = products.find((item) => item.id === line.productId);
    return product ? [{ product, qty: line.qty }] : [];
  });

  const applyPromo = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPromoMessage(
      promo.trim()
        ? "В демо-режиме промокоды не применяются."
        : "Введите промокод.",
    );
  };

  if (lines.length === 0) {
    return (
      <EmptyState
        icon="cart"
        title="Корзина пуста"
        description="Добавьте товары из каталога — здесь появятся цены, количество и итоговая сумма."
        action={<ButtonLink href="/catalog">Перейти в каталог</ButtonLink>}
      />
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6">
      <section className="min-w-0 rounded-card border border-line bg-surface shadow-card">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <h2 className="text-sm font-bold text-ink">
            Товары{" "}
            <span className="font-normal text-muted">· {cartCount} шт.</span>
          </h2>
          <button
            type="button"
            onClick={clearCart}
            className="flex items-center gap-1.5 text-xs font-medium text-muted transition-colors hover:text-ink"
          >
            <Icon name="trash" className="size-3.5" />
            Очистить
          </button>
        </div>

        <div className="divide-y divide-line px-4">
          {lines.map(({ product, qty }) => (
            <CartItem
              key={product.id}
              product={product}
              qty={qty}
              actions={
                <div className="flex items-center gap-2">
                  <QuantityStepper
                    value={qty}
                    onChange={(value) => setQty(product.id, value)}
                    max={
                      product.quantity > 0
                        ? Math.min(99, product.quantity)
                        : 99
                    }
                  />
                  <button
                    type="button"
                    onClick={() => removeFromCart(product.id)}
                    aria-label={`Удалить ${product.name} из корзины`}
                    className="flex size-11 items-center justify-center rounded-control border border-line-strong text-muted transition-colors hover:border-brand/30 hover:text-ink"
                  >
                    <Icon name="trash" className="size-4" />
                  </button>
                </div>
              }
            />
          ))}
        </div>

        <form
          onSubmit={applyPromo}
          className="border-t border-line px-4 py-4"
        >
          <label
            htmlFor="promo"
            className="text-xs font-semibold uppercase tracking-wide text-muted"
          >
            Промокод
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="promo"
              value={promo}
              onChange={(event) => setPromo(event.target.value)}
              placeholder="Введите промокод"
              className="h-11 min-w-0 flex-1 rounded-control border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-muted/70 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
            <button
              type="submit"
              className="h-11 shrink-0 rounded-control border border-line-strong bg-surface px-4 text-sm font-semibold text-ink transition-colors hover:bg-brand-50"
            >
              Применить
            </button>
          </div>
          {promoMessage ? (
            <p className="mt-2 text-xs text-muted">{promoMessage}</p>
          ) : null}
        </form>
      </section>

      <OrderSummary lines={lines}>
        <ButtonLink
          href="/checkout"
          variant="accent"
          className="w-full"
        >
          Перейти к оформлению
          <Icon name="arrowRight" className="size-4" />
        </ButtonLink>
        <Link
          href="/catalog"
          className="mt-2 flex h-11 items-center justify-center rounded-control border border-line-strong bg-surface text-sm font-semibold text-ink transition-colors hover:bg-brand-50"
        >
          Продолжить покупки
        </Link>
        <p className="mt-3 text-[11px] leading-relaxed text-muted">
          Оплата при получении, картой курьеру или по счёту для юрлиц. Цены и
          наличие подтверждаются при сборке заказа.
        </p>
      </OrderSummary>
    </div>
  );
}
