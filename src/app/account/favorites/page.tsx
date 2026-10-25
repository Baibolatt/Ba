import type { Metadata } from "next";
import { AccountShell } from "@/components/account/account-shell";
import { FavoritesView } from "@/components/account/favorites-view";
import { getProducts } from "@/lib/data";

export const metadata: Metadata = {
  title: "Избранное",
  description: "Сохранённые товары клиента PartsHub.",
};

export default async function FavoritesPage() {
  const products = await getProducts();

  return (
    <AccountShell
      title="Избранное"
      description="Товары, которые вы сохранили на потом."
    >
      <FavoritesView products={products} />
    </AccountShell>
  );
}
