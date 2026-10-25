import type { Metadata } from "next";
import Link from "next/link";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";

export const metadata: Metadata = {
  title: "Вход",
  description: "Вход в личный кабинет PartsHub.",
};

export default function LoginPage() {
  return (
    <AuthLayout
      title="Вход в кабинет"
      subtitle="Посмотрите заказы, избранное и уведомления."
      footer={
        <>
          Нет аккаунта?{" "}
          <Link
            href="/register"
            className="font-semibold text-brand underline-offset-2 hover:underline"
          >
            Зарегистрироваться
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}
