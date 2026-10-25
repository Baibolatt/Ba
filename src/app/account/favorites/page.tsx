import type { Metadata } from "next";
import { AccountShell } from "@/components/account/account-shell";
import { FavoritesView } from "@/components/account/favorites-view";

export const metadata: Metadata = {
  title: "Избранное",
  description: "Сохранённые товары клиента PartsHub.",
};

export default function FavoritesPage() {
  return (
    <AccountShell
      title="Избранное"
      description="Товары, которые вы сохранили на потом."
    >
      <FavoritesView />
    </AccountShell>
  );
}
