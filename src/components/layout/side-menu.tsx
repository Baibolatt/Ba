"use client";

import Link from "next/link";
import { useEffect } from "react";
import { cn } from "@/lib/cn";
import type { Category } from "@/lib/types";
import { Icon, type IconName } from "@/components/ui/icon";
import { Logo } from "@/components/layout/logo";

type SideMenuProps = {
  open: boolean;
  onClose: () => void;
  categories: Category[];
};

type MenuLink = {
  href: string;
  label: string;
  icon: IconName;
};

const customerLinks: MenuLink[] = [
  { href: "/for-customers", label: "Клиентам", icon: "fileText" },
  { href: "/company", label: "Компания", icon: "info" },
  { href: "/feedback", label: "Обратная связь", icon: "mail" },
];

const accountLinks: MenuLink[] = [
  { href: "/account", label: "Личный кабинет", icon: "user" },
  { href: "/account/orders", label: "Мои заказы", icon: "box" },
  { href: "/account/favorites", label: "Избранное", icon: "heart" },
  { href: "/account/notifications", label: "Уведомления", icon: "bell" },
];

export function SideMenu({ open, onClose, categories }: SideMenuProps) {
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none",
      )}
      aria-hidden={!open}
    >
      <button
        type="button"
        tabIndex={open ? 0 : -1}
        aria-label="Закрыть меню"
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-ink/45 backdrop-blur-[2px] transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0",
        )}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Меню"
        className={cn(
          "absolute inset-y-0 left-0 flex w-[86%] max-w-[340px] flex-col bg-surface shadow-float transition-transform duration-200 ease-out",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-line px-4">
          <Logo onNavigate={onClose} />
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть меню"
            className="flex size-11 items-center justify-center rounded-full text-icon transition-colors hover:bg-brand-50 hover:text-ink"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4">
          <div className="mb-4 flex items-center gap-2.5 rounded-control bg-tint px-2.5 py-2.5">
            <Icon name="mapPin" className="size-4 shrink-0 text-icon" />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">Тараз</p>
              <p className="text-[11px] text-muted">Доставка по области</p>
            </div>
          </div>

          <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            Каталог
          </p>
          <nav className="space-y-0.5">
            <Link
              href="/catalog"
              onClick={onClose}
              className="flex min-h-11 items-center gap-3 rounded-control px-2 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-brand-50"
            >
              <span className="flex size-8 items-center justify-center rounded-control bg-tint text-icon">
                <Icon name="grid" className="size-4" />
              </span>
              Все категории
            </Link>
            {categories.map((category) => (
              <Link
                key={category.slug}
                href={`/catalog/${category.slug}`}
                onClick={onClose}
                className="flex min-h-11 items-center gap-3 rounded-control px-2 py-2.5 text-sm text-ink transition-colors hover:bg-brand-50"
              >
                <span className="flex size-8 items-center justify-center rounded-control bg-brand-50 text-brand">
                  <Icon name={category.icon} className="size-4" />
                </span>
                {category.name}
              </Link>
            ))}
          </nav>

          <p className="px-2 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            Покупателям
          </p>
          <nav className="space-y-0.5">
            {customerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="flex min-h-11 items-center gap-3 rounded-control px-2 py-2.5 text-sm text-ink transition-colors hover:bg-brand-50"
              >
                <Icon name={link.icon} className="size-4 text-muted" />
                {link.label}
              </Link>
            ))}
          </nav>

          <p className="px-2 pb-2 pt-5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted">
            Личный кабинет
          </p>
          <nav className="space-y-0.5">
            {accountLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                className="flex min-h-11 items-center gap-3 rounded-control px-2 py-2.5 text-sm text-ink transition-colors hover:bg-brand-50"
              >
                <Icon name={link.icon} className="size-4 text-muted" />
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="border-t border-line px-4 py-4">
          <a
            href="tel:+77000000000"
            className="flex items-center gap-2 text-sm font-semibold text-ink"
          >
            <Icon name="phone" className="size-4 text-icon" />
            +7 (700) 000-00-00
          </a>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted">
            <span className="size-1.5 rounded-full bg-muted" />
            Со склада · самовывоз сегодня
          </p>
        </div>
      </div>
    </div>
  );
}
