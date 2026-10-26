"use client";

import Link from "next/link";
import type { Product } from "@/lib/types";
import { useStore } from "@/components/providers/store-provider";
import { CartItem } from "@/components/cart/cart-item";
import { QuantityStepper } from "@/components/catalog/quantity-stepper";
import { OrderSummary } from "@/components/cart/order-summary";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";
import { formatPrice } from "@/lib/format";

export function CartView({ products }: { products: Product[] }) {
  const { cart, cartCount, setQty, removeFromCart, clearCart } = useStore();

  const lines = cart.flatMap((line) => {
    const product = products.find((item) => item.id === line.productId);
    return product ? [{ product, qty: line.qty }] : [];
  });
  const total = lines.reduce(
    (sum, line) => sum + line.product.price * line.qty,
    0,
  );

  if (lines.length === 0) {
    return (
      <EmptyState
        icon="cart"
        title="Заявка пуста"
        description="Добавьте товары из каталога — здесь появятся цены, количество и итоговая сумма."
        action={<ButtonLink href="/catalog">Перейти в каталог</ButtonLink>}
      />
    );
  }

  return (
    <>
      <div className="grid gap-5 pb-44 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6 lg:pb-0">
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
                    aria-label={`Удалить ${product.name} из заявки`}
                    className="flex size-11 items-center justify-center rounded-control border border-line-strong text-muted transition-colors hover:border-brand/30 hover:text-ink"
                  >
                    <Icon name="trash" className="size-4" />
                  </button>
                </div>
              }
            />
          ))}
        </div>

      </section>

        <OrderSummary lines={lines} title="Ваша заявка">
          <div className="hidden lg:block">
            <ButtonLink
              href="/checkout"
              variant="accent"
              className="w-full"
            >
              Оформить заявку
              <Icon name="arrowRight" className="size-4" />
            </ButtonLink>
            <Link
              href="/catalog"
              className="mt-2 flex h-11 items-center justify-center rounded-control border border-line-strong bg-surface text-sm font-semibold text-ink transition-colors hover:bg-brand-50"
            >
              Продолжить подбор
            </Link>
          </div>
          <p className="mt-3 text-[11px] leading-relaxed text-muted">
            Оплата по счёту для юрлиц или по согласованию с менеджером. Цены и
            наличие подтверждаются при сборке заявки.
          </p>
        </OrderSummary>
      </div>

      <div className="fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30 border-t border-line bg-surface px-4 py-3 shadow-float lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div>
            <p className="text-[11px] text-muted">Итого · {cartCount} шт.</p>
            <p className="text-lg font-bold leading-tight text-brand">
              {formatPrice(total)}
            </p>
          </div>
          <ButtonLink
            href="/checkout"
            variant="accent"
            className="shrink-0"
          >
            Оформить
            <Icon name="arrowRight" className="size-4" />
          </ButtonLink>
        </div>
      </div>
    </>
  );
}
