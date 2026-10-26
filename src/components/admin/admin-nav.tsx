"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/ui/icon";

const links: Array<{
  href: string;
  label: string;
  icon: IconName;
  exact?: boolean;
}> = [
  { href: "/admin", label: "Обзор", icon: "grid", exact: true },
  { href: "/admin/orders", label: "Заказы", icon: "box" },
  { href: "/admin/products", label: "Товары", icon: "listView" },
  { href: "/admin/import", label: "Импорт", icon: "fileText" },
  { href: "/admin/catalog", label: "Справочники", icon: "settings" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Разделы админ-панели"
      className="mt-4 flex flex-wrap gap-1 rounded-card border border-line bg-surface p-1.5 shadow-card"
    >
      {links.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href ||
            pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-10 shrink-0 items-center gap-1.5 rounded-control px-3 py-2 text-xs font-semibold transition-colors",
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
  );
}
