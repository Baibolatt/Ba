import type { Metadata } from "next";
import { AccountShell } from "@/components/account/account-shell";
import { OrdersList } from "@/components/account/orders-list";
import { getOrdersByUser } from "@/lib/data";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Заказы",
  description: "История заказов и текущие статусы PartsHub.",
};

export default async function OrdersPage() {
  const user = await requireUser();
  const orders = await getOrdersByUser(user.id);

  return (
    <AccountShell
      title="Заказы"
      description="История заказов и текущие статусы сборки."
    >
      <OrdersList orders={orders} />
    </AccountShell>
  );
}
