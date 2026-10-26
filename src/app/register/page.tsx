import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Регистрация",
  description: "Создание аккаунта PartsHub.",
};

// Проверка сессии требует cookie, поэтому статическая оболочка не нужна.
export const instant = false;

export default async function RegisterPage() {
  if (await getCurrentUser()) {
    redirect("/account");
  }

  return (
    <AuthLayout
      title="Регистрация"
      subtitle="Достаточно номера телефона — сохраним заказы и контакты."
      footer={
        <>
          Уже есть аккаунт?{" "}
          <Link
            href="/login"
            className="font-semibold text-brand underline-offset-2 hover:underline"
          >
            Войти
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}
