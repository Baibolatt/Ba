import type { Metadata } from "next";
import { AccountShell } from "@/components/account/account-shell";
import { ProfileForm } from "@/components/account/profile-form";
import { requireUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Профиль",
  description: "Контактные данные и адрес доставки клиента PartsHub.",
};

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <AccountShell
      title="Профиль"
      description="Контактные данные и адрес доставки по умолчанию."
    >
      <ProfileForm user={user} />
    </AccountShell>
  );
}
