import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/auth-layout";
import { RegisterForm } from "@/components/auth/register-form";

export const metadata: Metadata = {
  title: "Регистрация",
  description: "Создание аккаунта PartsHub.",
};

export default function RegisterPage() {
  return (
    <AuthLayout
      title="Регистрация"
      subtitle="Сохраним заказы, избранное и контактные данные."
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
