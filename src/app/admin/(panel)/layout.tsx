import type { Metadata } from "next";
import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Button } from "@/components/ui/button";
import { logoutAdminAction } from "@/app/admin/actions";
import { isAdminAuthenticated } from "@/lib/admin-auth";

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
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  return (
    <Container className="py-5 sm:py-8">
      <Breadcrumbs
        items={[{ label: "Главная", href: "/" }, { label: "Админ-панель" }]}
      />

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            Админ-панель
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            Заказы, статусы сборки, цены и остатки товаров.
          </p>
        </div>
        <form action={logoutAdminAction}>
          <Button type="submit" variant="secondary" size="sm">
            Выйти
          </Button>
        </form>
      </div>

      <div className="mt-5">{children}</div>
    </Container>
  );
}
