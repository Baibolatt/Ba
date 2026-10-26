import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CartView } from "@/components/cart/cart-view";
import { getProducts } from "@/lib/data";

export const metadata: Metadata = {
  title: "Заявка",
  description: "Выбранные автозапчасти, количество и итоговая сумма оптовой заявки.",
};

export default async function CartPage() {
  const products = await getProducts();

  return (
    <Container className="py-5 sm:py-8">
      <Breadcrumbs
        items={[{ label: "Главная", href: "/" }, { label: "Заявка" }]}
      />
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        Заявка
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Проверьте состав и количество. Менеджер подтвердит наличие, цену и
        условия.
      </p>

      <div className="mt-5">
        <CartView products={products} />
      </div>
    </Container>
  );
}
