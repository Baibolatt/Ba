import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { AccountNav } from "@/components/account/account-nav";

type AccountShellProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function AccountShell({ title, description, children }: AccountShellProps) {
  return (
    <Container className="py-5 sm:py-8">
      <Breadcrumbs
        items={[
          { label: "Главная", href: "/" },
          { label: "Кабинет", href: "/account" },
          { label: title },
        ]}
      />

      <div className="mt-4 grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-6">
        <AccountNav />

        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-3xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-1.5 text-sm text-muted">{description}</p>
          ) : null}
          <div className="mt-5">{children}</div>
        </div>
      </div>
    </Container>
  );
}
