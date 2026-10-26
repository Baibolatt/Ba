import type { Metadata } from "next";
import { AccountShell } from "@/components/account/account-shell";
import { NotificationsView } from "@/components/account/notifications-view";
import { notifications } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Уведомления",
  description: "События по заявкам и наличию товаров PartsHub.",
};

export default function NotificationsPage() {
  return (
    <AccountShell
      title="Уведомления"
      description="Статусы заявок и события по сохранённым товарам."
    >
      <NotificationsView initialItems={notifications} />
    </AccountShell>
  );
}
