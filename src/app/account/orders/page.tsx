import type { Metadata } from "next";
import { AccountShell } from "@/components/account/account-shell";
import { OrdersList } from "@/components/account/orders-list";
import { orders } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Заказы",
  description: "История заказов и текущие статусы PartsHub.",
};

export default function OrdersPage() {
  return (
    <AccountShell
      title="Заказы"
      description="История заказов и текущие статусы сборки."
    >
      <OrdersList orders={orders} />
    </AccountShell>
  );
}
