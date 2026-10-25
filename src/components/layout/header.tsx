"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";
import { Container } from "@/components/layout/container";
import { Logo } from "@/components/layout/logo";
import { SideMenu } from "@/components/layout/side-menu";
import { useStore } from "@/components/providers/store-provider";

const cities = ["Москва", "Санкт-Петербург", "Казань", "Екатеринбург"];

export function Header() {
  const router = useRouter();
  const { cartCount } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [city, setCity] = useState(cities[0]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/search?q=${encodeURIComponent(value)}` : "/search");
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-surface/95 backdrop-blur">
        <Container>
          <div className="flex h-14 items-center gap-2 md:h-[72px] md:gap-6">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Открыть меню"
              className="flex size-9 shrink-0 items-center justify-center rounded-control text-ink transition-colors hover:bg-brand-50 md:hidden"
            >
              <Icon name="menu" className="size-5" />
            </button>

            <Logo />

            <div className="relative ml-1 block md:ml-0">
              <select
                aria-label="Город доставки"
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className="h-8 cursor-pointer appearance-none rounded-full bg-transparent py-0 pl-7 pr-5 text-xs font-medium text-muted transition-colors hover:bg-brand-50 focus:outline-none"
              >
                {cities.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <Icon
                name="mapPin"
                className="pointer-events-none absolute left-1.5 top-1/2 size-3.5 -translate-y-1/2 text-muted"
              />
              <Icon
                name="chevronDown"
                className="pointer-events-none absolute right-1 top-1/2 size-3 -translate-y-1/2 text-muted"
              />
            </div>

            <Link
              href="/catalog"
              className="hidden h-10 items-center gap-2 rounded-control border border-line-strong bg-surface px-3 text-sm font-semibold text-ink transition-colors hover:bg-brand-50 md:flex"
            >
              <Icon name="grid" className="size-4 text-accent" />
              Каталог
            </Link>

            <form onSubmit={submitSearch} className="hidden flex-1 md:block">
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
                  className="h-11 w-full rounded-control border border-line bg-page pl-9 pr-24 text-sm text-ink placeholder:text-muted/80 focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25"
                />
                <button
                  type="submit"
                  className="absolute right-1 top-1 h-9 rounded-[8px] bg-accent px-4 text-xs font-bold text-brand transition-colors hover:bg-accent-600"
                >
                  Найти
                </button>
              </div>
            </form>

            <a
              href="tel:+74951234567"
              className="hidden items-center gap-2 text-sm font-semibold text-ink transition-colors hover:text-brand-700 xl:flex"
            >
              <Icon name="phone" className="size-4 text-accent" />
              +7 (495) 123-45-67
            </a>

            <div className="ml-auto flex items-center gap-0.5 md:ml-0 md:gap-1">
              <Link
                href="/account/favorites"
                aria-label="Избранное"
                className="relative flex size-9 items-center justify-center rounded-control text-ink transition-colors hover:bg-brand-50"
              >
                <Icon name="heart" className="size-5" />
              </Link>
              <Link
                href="/login"
                aria-label="Вход и регистрация"
                className="hidden size-9 items-center justify-center rounded-control text-ink transition-colors hover:bg-brand-50 sm:flex"
              >
                <Icon name="user" className="size-5" />
              </Link>
              <Link
                href="/cart"
                aria-label={`Корзина, товаров: ${cartCount}`}
                className="relative flex size-9 items-center justify-center rounded-control text-ink transition-colors hover:bg-brand-50"
              >
                <Icon name="cart" className="size-5" />
                {cartCount > 0 ? (
                  <span className="absolute -right-0.5 -top-0.5 flex min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-bold leading-4 text-brand">
                    {cartCount}
                  </span>
                ) : null}
              </Link>
            </div>
          </div>

          <form onSubmit={submitSearch} className="pb-3 md:hidden">
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
                className="h-11 w-full rounded-control border border-line bg-page pl-9 pr-14 text-sm text-ink placeholder:text-muted/80 focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-accent/25"
              />
              <button
                type="submit"
                aria-label="Найти"
                className="absolute right-1 top-1 flex size-9 items-center justify-center rounded-[8px] bg-accent text-brand transition-colors hover:bg-accent-600"
              >
                <Icon name="search" className="size-4" strokeWidth={2} />
              </button>
            </div>
          </form>
        </Container>

        <div className="hidden border-t border-line/70 md:block">
          <Container>
            <nav className="flex h-10 items-center gap-6 text-xs font-medium text-muted">
              <Link href="/catalog" className="transition-colors hover:text-ink">
                Каталог запчастей
              </Link>
              <Link
                href="/for-customers"
                className="transition-colors hover:text-ink"
              >
                Клиентам
              </Link>
              <Link href="/company" className="transition-colors hover:text-ink">
                Компания
              </Link>
              <Link href="/feedback" className="transition-colors hover:text-ink">
                Обратная связь
              </Link>
              <span className="ml-auto flex items-center gap-1.5 text-success">
                <span className="size-1.5 rounded-full bg-success" />
                Со склада · самовывоз сегодня
              </span>
            </nav>
          </Container>
        </div>
      </header>

      <SideMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
