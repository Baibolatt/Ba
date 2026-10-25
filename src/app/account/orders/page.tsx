import type { Metadata } from "next";
import { AccountShell } from "@/components/account/account-shell";
import { OrdersList } from "@/components/account/orders-list";
import { getOrders } from "@/lib/data";

export const metadata: Metadata = {
  title: "Заказы",
  description: "История заказов и текущие статусы PartsHub.",
};

export default async function OrdersPage() {
  const orders = await getOrders();

  return (
    <AccountShell
      title="Заказы"
      description="История заказов и текущие статусы сборки."
    >
      <OrdersList orders={orders} />
    </AccountShell>
  );
}
