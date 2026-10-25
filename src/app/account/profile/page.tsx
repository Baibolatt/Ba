import type { Metadata } from "next";
import { AccountShell } from "@/components/account/account-shell";
import { ProfileForm } from "@/components/account/profile-form";

export const metadata: Metadata = {
  title: "Профиль",
  description: "Контактные данные и адрес доставки клиента PartsHub.",
};

export default function ProfilePage() {
  return (
    <AccountShell
      title="Профиль"
      description="Контактные данные и адрес доставки по умолчанию."
    >
      <ProfileForm />
    </AccountShell>
  );
}
