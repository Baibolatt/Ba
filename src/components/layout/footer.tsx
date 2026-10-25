import Link from "next/link";
import { categories } from "@/lib/mock-data";
import { Container } from "@/components/layout/container";
import { Icon } from "@/components/ui/icon";
import { Logo } from "@/components/layout/logo";

const customerLinks = [
  { href: "/for-customers", label: "Доставка и оплата" },
  { href: "/for-customers#returns", label: "Возврат и гарантия" },
  { href: "/feedback", label: "Обратная связь" },
  { href: "/account/orders", label: "Мои заказы" },
];

const companyLinks = [
  { href: "/company", label: "О складе" },
  { href: "/company#contacts", label: "Контакты" },
  { href: "/company#requisites", label: "Реквизиты" },
  { href: "/feedback", label: "Стать партнёром" },
];

export function Footer() {
  return (
    <footer className="mt-12 border-t border-line bg-surface">
      <Container className="py-10">
        <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-4">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              Оптовый склад автозапчастей: подбор по каталогу, самовывоз в день
              заказа и доставка по городу.
            </p>
            <p className="mt-4 flex items-center gap-1.5 text-xs font-medium text-success">
              <span className="size-1.5 rounded-full bg-success" />
              Со склада · самовывоз сегодня
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
            <h2 className="text-sm font-bold text-ink">Клиентам</h2>
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
              href="tel:+74951234567"
              className="mt-4 flex items-center gap-2 text-sm font-semibold text-ink"
            >
              <Icon name="phone" className="size-4 text-accent" />
              +7 (495) 123-45-67
            </a>
            <a
              href="mailto:zakaz@partshub.ru"
              className="mt-2 flex items-center gap-2 text-sm text-muted transition-colors hover:text-ink"
            >
              <Icon name="mail" className="size-4" />
              zakaz@partshub.ru
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-line pt-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 PartsHub. Демонстрационный проект, данные тестовые.</p>
          <p>Оплата при получении · картой курьеру · по счёту для юрлиц</p>
        </div>
      </Container>
    </footer>
  );
}
