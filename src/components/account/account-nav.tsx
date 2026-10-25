"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/ui/icon";

const links: Array<{ href: string; label: string; icon: IconName; exact?: boolean }> = [
  { href: "/account", label: "Обзор", icon: "grid", exact: true },
  { href: "/account/profile", label: "Профиль", icon: "user" },
  { href: "/account/orders", label: "Заказы", icon: "box" },
  { href: "/account/favorites", label: "Избранное", icon: "heart" },
  { href: "/account/notifications", label: "Уведомления", icon: "bell" },
];

export function AccountNav() {
  const pathname = usePathname();

  return (
    <div className="lg:rounded-card lg:border lg:border-line lg:bg-surface lg:p-2 lg:shadow-card">
      <nav
        aria-label="Разделы кабинета"
        className="flex flex-wrap gap-1 pb-1 lg:flex-col lg:pb-0"
      >
        {links.map((link) => {
          const active = link.exact
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`);

          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 shrink-0 items-center gap-2 whitespace-nowrap rounded-control px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand text-white"
                  : "text-muted hover:bg-brand-50 hover:text-ink",
              )}
            >
              <Icon name={link.icon} className="size-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>

      <Link
        href="/login"
        className="mt-2 hidden items-center gap-2 border-t border-line px-3 pb-1 pt-3 text-sm font-medium text-muted transition-colors hover:text-ink lg:flex"
      >
        <Icon name="logOut" className="size-4" />
        Выйти
      </Link>
    </div>
  );
}
