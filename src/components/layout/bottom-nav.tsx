"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { Icon, type IconName } from "@/components/ui/icon";
import { useStore } from "@/components/providers/store-provider";

type NavItem = {
  href: string;
  label: string;
  icon: IconName;
  exact?: boolean;
  isCart?: boolean;
};

const items: NavItem[] = [
  { href: "/", label: "Главная", icon: "home", exact: true },
  { href: "/catalog", label: "Каталог", icon: "grid" },
  { href: "/cart", label: "Корзина", icon: "cart", exact: true, isCart: true },
  { href: "/account/favorites", label: "Избранное", icon: "heart", exact: true },
  { href: "/account", label: "Кабинет", icon: "user" },
];

export function BottomNav() {
  const pathname = usePathname();
  const { cartCount } = useStore();

  const isActive = (item: NavItem) => {
    if (item.href === "/account") {
      return (
        pathname.startsWith("/account") &&
        !pathname.startsWith("/account/favorites")
      );
    }
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(`${item.href}/`);
  };

  return (
    <nav
      aria-label="Основная навигация"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <div className="grid h-16 grid-cols-5">
        {items.map((item) => {
          const active = isActive(item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                active ? "text-brand" : "text-muted",
              )}
            >
              <span
                className={cn(
                  "absolute top-0 h-0.5 w-8 rounded-full transition-colors",
                  active ? "bg-brand" : "bg-transparent",
                )}
              />
              <span className="relative">
                <Icon
                  name={item.icon}
                  className={cn("size-5", active && "text-brand")}
                  strokeWidth={active ? 2 : 1.7}
                />
                {item.isCart && cartCount > 0 ? (
                  <span className="absolute -right-2 -top-1.5 flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[9px] font-bold leading-4 text-white">
                    {cartCount}
                  </span>
                ) : null}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
