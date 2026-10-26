"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { SideMenu } from "@/components/layout/side-menu";
import { useStore } from "@/components/providers/store-provider";
import type { Category } from "@/lib/types";

const navItems = [
  { href: "/catalog", label: "Каталог" },
  { href: "/for-customers", label: "Оптовикам" },
  { href: "/company", label: "Компания" },
  { href: "/feedback", label: "Обратная связь" },
];

export function Header({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const { cartCount } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
  };

  const isActive = (href: string) => {
    if (href === "/catalog") {
      return (
        pathname.startsWith("/catalog") ||
        pathname.startsWith("/product") ||
        pathname.startsWith("/search")
      );
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
        <Container>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2 py-2 lg:h-[72px] lg:flex-nowrap lg:gap-5 lg:py-0">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Открыть меню"
              className="flex size-11 shrink-0 items-center justify-center rounded-control text-icon transition-colors hover:bg-brand-50 lg:hidden"
            >
              <Icon name="menu" className="size-5" />
            </button>

            <Logo />

            <form
              onSubmit={submitSearch}
              className="order-last w-full min-w-0 lg:order-none lg:w-auto lg:flex-1"
            >
              <div className="relative">
                <Icon
                  name="search"
                  className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
                />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Артикул, название или бренд"
                  aria-label="Поиск по каталогу"
                  className="h-12 w-full rounded-control border border-line bg-page pl-9 pr-20 text-sm text-ink placeholder:text-muted/80 focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
                <button
                  type="submit"
                  className="absolute right-0.5 top-0.5 h-11 rounded-[8px] bg-brand px-3.5 text-xs font-bold text-white transition-colors hover:bg-brand-800"
                >
                  Найти
                </button>
              </div>
            </form>

            <nav
              aria-label="Разделы сайта"
              className="hidden shrink-0 items-center gap-5 text-sm font-medium lg:flex"
            >
              {navItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "whitespace-nowrap transition-colors hover:text-ink",
                      active ? "font-semibold text-brand" : "text-muted",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto flex items-center gap-1 lg:ml-0">
              <Link
                href="/account/favorites"
                aria-label="Избранное"
                className="hidden size-11 items-center justify-center rounded-control text-icon transition-colors hover:bg-brand-50 lg:flex"
              >
                <Icon name="heart" className="size-5" />
              </Link>
              <Link
                href="/account"
                aria-label="Личный кабинет"
                className="hidden size-11 items-center justify-center rounded-control text-icon transition-colors hover:bg-brand-50 lg:flex"
              >
                <Icon name="user" className="size-5" />
              </Link>
              <Link
                href="/cart"
                aria-label={`Заявка, позиций: ${cartCount}`}
                className="relative flex size-11 items-center justify-center rounded-control text-icon transition-colors hover:bg-brand-50"
              >
                <Icon name="cart" className="size-5" />
                {cartCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold leading-4 text-white">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
            </div>
          </div>
        </Container>
      </header>

      <SideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        categories={categories}
      />
    </>
  );
}
