import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { AuthLayout } from "@/components/auth/auth-layout";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Вход",
  description: "Вход в личный кабинет PartsHub.",
};

// Проверка сессии требует cookie, поэтому статическая оболочка не нужна.
export const instant = false;

export default async function LoginPage() {
  if (await getCurrentUser()) {
    redirect("/account");
  }

  return (
    <AuthLayout
      title="Вход в кабинет"
      subtitle="Войдите по номеру телефона, чтобы видеть свои заказы."
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
