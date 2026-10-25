import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CheckoutView } from "@/components/checkout/checkout-view";
import { getProducts } from "@/lib/data";

export const metadata: Metadata = {
  title: "Оформление заказа",
  description: "Контакты, способ получения и оплаты заказа PartsHub.",
};

export default async function CheckoutPage() {
  const products = await getProducts();

  return (
    <Container className="py-5 sm:py-8">
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Корзина", href: "/cart" },
          { label: "Оформление" },
        ]}
      />
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        Оформление заказа
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Три шага: контакты, получение и оплата. Данные можно изменить до
        отправки.
      </p>

      <div className="mt-5">
        <CheckoutView products={products} />
      </div>
    </Container>
  );
}
