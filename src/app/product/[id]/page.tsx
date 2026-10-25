import type { Metadata } from "next";

type ProductPageProps = {
  params: Promise<{ id: string }>;
};

export const metadata: Metadata = {
  title: "Товар",
};

// Динамический маршрут: данные товара будут загружаться на этапе 3.
export const instant = false;

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;

  return (
    <section className="space-y-3">
      <h1 className="text-2xl font-semibold tracking-tight">Карточка товара</h1>
      <p className="text-zinc-600">
        Товар <span className="font-mono text-zinc-900">{id}</span> — страница в
        разработке.
      </p>
    </section>
  );
}
