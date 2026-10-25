import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Каталог",
};

export default function CatalogPage() {
  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight">Каталог</h1>
      <p className="text-zinc-600">Здесь появится список товаров.</p>
    </section>
  );
}
