import type { Metadata } from "next";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = {
  title: "Страница не найдена",
  description: "Такой страницы на PartsHub нет.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function NotFound() {
  return (
    <Container className="py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "404" }]} />

      <section className="mx-auto mt-8 max-w-lg rounded-card border border-line bg-surface p-5 text-center shadow-card sm:p-8">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-tint text-icon">
          <Icon name="search" className="size-8" />
        </span>
        <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          Ошибка 404
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Страница не найдена
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Возможно, ссылка устарела или в адресе опечатка. Проверьте артикул или
          откройте каталог.
        </p>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <ButtonLink href="/">
            На главную
            <Icon name="arrowRight" className="size-4" />
          </ButtonLink>
          <ButtonLink href="/catalog" variant="secondary">
            В каталог
          </ButtonLink>
        </div>
      </section>
    </Container>
  );
}
