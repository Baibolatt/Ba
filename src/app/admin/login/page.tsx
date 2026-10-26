import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Icon } from "@/components/ui/icon";
import { AdminLoginForm } from "@/components/admin/login-form";
import { hasAdminPassword } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Вход в админку",
  description: "Защищённый вход в панель управления PartsHub.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLoginPage() {
  return (
    <Container className="py-5 sm:py-8">
      <Breadcrumbs
        items={[{ label: "Главная", href: "/" }, { label: "Админ-панель" }]}
      />

      <div className="mx-auto mt-8 max-w-md">
        <section className="rounded-card border border-line bg-surface p-5 text-center shadow-card sm:p-7">
          <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-tint text-icon">
            <Icon name="shield" className="size-7" />
          </span>
          <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink">
            Вход в админ-панель
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            Введите пароль администратора, чтобы управлять заказами и остатками.
          </p>

          {hasAdminPassword() ? (
            <AdminLoginForm />
          ) : (
            <p className="mt-5 rounded-control bg-danger-soft p-3 text-left text-xs font-medium text-danger">
              ADMIN_PASSWORD не задан. Добавьте переменную в `.env` и
              перезапустите сервер.
            </p>
          )}

          <p className="mt-5 text-[11px] leading-relaxed text-muted">
            Доступ только для сотрудников склада. Пароль хранится в `.env` и не
            попадает в репозиторий.
          </p>
        </section>
      </div>
    </Container>
  );
}
