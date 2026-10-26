import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { CheckoutView } from "@/components/checkout/checkout-view";
import { getProducts } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Оформление заявки",
  description: "Контакты, способ получения и оплаты оптовой заявки PartsHub.",
};

// Контакты подставляются из сессии, поэтому нужна проверка cookie.
export const instant = false;

export default async function CheckoutPage() {
  const [products, customer] = await Promise.all([
    getProducts(),
    getCurrentUser(),
  ]);

  return (
    <Container className="py-5 sm:py-8">
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Заявка", href: "/cart" },
          { label: "Оформление" },
        ]}
      />
      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        Оформление заявки
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Три шага: контакты, получение и оплата. Менеджер подтвердит наличие и
        условия.
      </p>

      <div className="mt-5">
        <CheckoutView products={products} customer={customer} />
      </div>
    </Container>
  );
}
