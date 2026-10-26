import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { AdminNav } from "@/components/admin/admin-nav";
import { logoutAdminAction } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: {
    default: "Админ-панель",
    template: "%s — PartsHub",
  },
  robots: {
    index: false,
    follow: false,
  },
};

// Проверка cookie должна выполниться до отдачи страницы, без статической оболочки.
export const instant = false;

export default async function AdminPanelLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAdmin();

  return (
    <Container className="py-5 sm:py-8">
      <Breadcrumbs
        items={[{ label: "Главная", href: "/" }, { label: "Админ-панель" }]}
      />

      <div className="mt-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Админ-панель
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Заказы, статусы сборки, цены и остатки товаров.
          </p>
        </div>
        <form action={logoutAdminAction} className="shrink-0">
          <Button type="submit" variant="secondary" size="sm">
            Выйти
          </Button>
        </form>
      </div>

      <AdminNav />

      <div className="mt-5">{children}</div>
    </Container>
  );
}
