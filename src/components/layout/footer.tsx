import Link from "next/link";
import type { Category } from "@/lib/types";
import { Container } from "@/components/layout/container";
import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/layout/logo";
import { siteConfig } from "@/lib/site";

const customerLinks = [
  { href: "/for-customers", label: "Условия для оптовиков" },
  { href: "/for-customers#returns", label: "Возврат и гарантия" },
  { href: "/feedback", label: "Обратная связь" },
  { href: "/account/orders", label: "Мои заявки" },
];

const companyLinks = [
  { href: "/company", label: "О складе" },
  { href: "/company#contacts", label: "Контакты" },
  { href: "/company#requisites", label: "Реквизиты" },
  { href: "/feedback", label: "Стать партнёром" },
];

export function Footer({ categories }: { categories: Category[] }) {
  return (
    <footer className="mt-12 border-t border-line bg-surface">
      <Container className="py-10">
        <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Оптовый склад автозапчастей для автосервисов, магазинов и
              автопарков. Работаем с юридическими лицами.
            </p>
            <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-muted">
              <span className="size-1.5 rounded-full bg-muted" />
              Только опт · документы для юрлиц
            </p>
          </div>

          <div>
            <h2 className="text-sm font-bold text-ink">Каталог</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link
                    href={`/catalog/${category.slug}`}
                    className="transition-colors hover:text-ink"
                  >
                    {category.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-bold text-ink">Оптовикам</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {customerLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-sm font-bold text-ink">Компания</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted">
              {companyLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="transition-colors hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <a
              href={`tel:${siteConfig.phoneHref}`}
              className="mt-4 flex items-center gap-2 text-sm font-semibold text-ink"
            >
              <Icon name="phone" className="size-4 text-icon" />
              {siteConfig.phoneDisplay}
            </a>
            <a
              href={`mailto:${siteConfig.email}`}
              className="mt-2 flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
            >
              <Icon name="mail" className="size-4" />
              {siteConfig.email}
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 PartsHub. Оптовый склад автозапчастей.</p>
          <p>Оплата по счёту · документы для бухгалтерии</p>
        </div>
      </Container>
    </footer>
  );
}
