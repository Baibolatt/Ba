import type { ReactNode } from "react";
import { Container } from "@/components/layout/container";
import { Icon } from "@/components/ui/icon";

const benefits = [
  "История заказов и статусы сборки",
  "Избранное и уведомления",
  "Контактные данные для быстрого заказа",
  "Повтор заказа в пару кликов",
];

type AuthLayoutProps = {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: AuthLayoutProps) {
  return (
    <Container className="py-6 sm:py-10">
      <div className="mx-auto grid max-w-4xl overflow-hidden rounded-[22px] border border-line bg-surface shadow-card lg:grid-cols-[0.85fr_1.15fr]">
        <aside className="relative hidden flex-col bg-brand p-8 text-white lg:flex">
          <div
            className="pointer-events-none absolute -right-16 -top-16 size-48 rounded-full border border-white/10"
            aria-hidden="true"
          />
          <div className="relative flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-[10px] bg-accent text-brand">
              <Icon name="wrench" className="size-4" strokeWidth={2} />
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              PartsHub
            </span>
          </div>

          <h2 className="relative mt-10 text-2xl font-extrabold leading-tight">
            Всё по заказам —<br /> в одном месте
          </h2>
          <ul className="relative mt-6 space-y-3">
            {benefits.map((benefit) => (
              <li
                key={benefit}
                className="flex items-start gap-2.5 text-sm text-white/75"
              >
                <Icon
                  name="check"
                  className="mt-0.5 size-4 shrink-0 text-accent"
                  strokeWidth={2.5}
                />
                {benefit}
              </li>
            ))}
          </ul>

          <p className="relative mt-auto pt-10 text-[11px] leading-relaxed text-white/50">
            Демонстрационный проект PartsHub. Данные тестовые, реальная
            авторизация появится на следующем этапе.
          </p>
        </aside>

        <div className="p-5 sm:p-8">
          <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
          <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
          <div className="mt-5">{children}</div>
          <div className="mt-5 border-t border-line pt-4 text-sm text-muted">
            {footer}
          </div>
        </div>
      </div>
    </Container>
  );
}
