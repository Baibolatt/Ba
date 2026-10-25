import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CartView } from "@/components/cart/cart-view";
import { getProducts } from "@/lib/data";

export const metadata: Metadata = {
  title: "Корзина",
  description: "Выбранные автозапчасти, количество и итоговая сумма заказа.",
};

export default async function CartPage() {
  const products = await getProducts();

  return (
    <Container className="py-5 sm:py-8">
      <Breadcrumbs
        items={[{ label: "Главная", href: "/" }, { label: "Корзина" }]}
      />
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        Корзина
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Проверьте состав заказа, количество и способ получения.
      </p>

      <div className="mt-5">
        <CartView products={products} />
      </div>
    </Container>
  );
}
