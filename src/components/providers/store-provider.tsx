"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Icon } from "@/components/ui/icon";

export type CartLine = {
  productId: string;
  qty: number;
};

type StoreContextValue = {
  cart: CartLine[];
  favorites: string[];
  cartCount: number;
  addToCart: (productId: string, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  toggleFavorite: (productId: string) => void;
  isFavorite: (productId: string) => boolean;
};

const StoreContext = createContext<StoreContextValue | null>(null);

const CART_STORAGE_KEY = "partshub_cart_v1";
const FAVORITES_STORAGE_KEY = "partshub_favorites_v1";

function parseCart(raw: string | null): CartLine[] {
  if (!raw) return [];

  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];

    const seen = new Set<string>();
    const lines: CartLine[] = [];

    for (const item of value) {
      const productId =
        typeof item?.productId === "string" ? item.productId : "";
      const qty = Number(item?.qty);

      if (
        !productId ||
        !Number.isInteger(qty) ||
        qty <= 0 ||
        seen.has(productId)
      ) {
        continue;
      }

      seen.add(productId);
      lines.push({ productId, qty: Math.min(99, qty) });
    }

    return lines;
  } catch {
    return [];
  }
}

function parseFavorites(raw: string | null): string[] {
  if (!raw) return [];

  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];

    return Array.from(
      new Set(value.filter((item): item is string => typeof item === "string")),
    );
  } catch {
    return [];
  }
}

type ListStore<T> = {
  getSnapshot: () => T[];
  getServerSnapshot: () => T[];
  subscribe: (listener: () => void) => () => void;
  update: (updater: (current: T[]) => T[]) => void;
};

/**
 * Список, который хранится в localStorage. Чтение отдаётся через
 * useSyncExternalStore, поэтому серверная разметка не расходится с клиентской,
 * а изменения синхронизируются между вкладками.
 */
function createListStore<T>(
  key: string,
  parse: (raw: string | null) => T[],
  empty: T[],
): ListStore<T> {
  let initialized = false;
  let value: T[] = empty;
  const listeners = new Set<() => void>();

  const load = (): T[] => {
    if (typeof window === "undefined") return empty;

    if (!initialized) {
      initialized = true;

      try {
        value = parse(window.localStorage.getItem(key));
      } catch {
        value = empty;
      }
    }

    return value;
  };

  const emit = () => {
    for (const listener of listeners) listener();
  };

  return {
    getSnapshot: load,
    getServerSnapshot: () => empty,
    subscribe: (listener) => {
      listeners.add(listener);

      const onStorage = (event: StorageEvent) => {
        if (event.key !== key) return;

        initialized = true;
        value = parse(event.newValue);
        emit();
      };

      window.addEventListener("storage", onStorage);

      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
    update: (updater) => {
      value = updater(load());

      try {
        window.localStorage.setItem(key, JSON.stringify(value));
      } catch {
        // Приватный режим или переполненное хранилище: данные живут в памяти.
      }

      emit();
    },
  };
}

const emptyCart: CartLine[] = [];
const emptyFavorites: string[] = [];

const cartStore = createListStore(CART_STORAGE_KEY, parseCart, emptyCart);
const favoritesStore = createListStore(
  FAVORITES_STORAGE_KEY,
  parseFavorites,
  emptyFavorites,
);

export function StoreProvider({ children }: { children: ReactNode }) {
  const cart = useSyncExternalStore(
    cartStore.subscribe,
    cartStore.getSnapshot,
    cartStore.getServerSnapshot,
  );
  const favorites = useSyncExternalStore(
    favoritesStore.subscribe,
    favoritesStore.getSnapshot,
    favoritesStore.getServerSnapshot,
  );
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const notify = useCallback((message: string) => {
    setToast(message);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 2400);
  }, []);

  const addToCart = useCallback(
    (productId: string, qty = 1) => {
      cartStore.update((current) => {
        const existing = current.find((line) => line.productId === productId);
        if (existing) {
          return current.map((line) =>
            line.productId === productId
              ? { ...line, qty: Math.min(99, line.qty + qty) }
              : line,
          );
        }
        return [...current, { productId, qty }];
      });
      notify("Товар добавлен в корзину");
    },
    [notify],
  );

  const setQty = useCallback((productId: string, qty: number) => {
    cartStore.update((current) =>
      qty <= 0
        ? current.filter((line) => line.productId !== productId)
        : current.map((line) =>
            line.productId === productId
              ? { ...line, qty: Math.min(99, qty) }
              : line,
          ),
    );
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    cartStore.update((current) =>
      current.filter((line) => line.productId !== productId),
    );
  }, []);

  const clearCart = useCallback(() => {
    cartStore.update(() => []);
  }, []);

  const toggleFavorite = useCallback(
    (productId: string) => {
      const wasFavorite = favoritesStore
        .getSnapshot()
        .includes(productId);

      favoritesStore.update((current) =>
        wasFavorite
          ? current.filter((id) => id !== productId)
          : [...current, productId],
      );

      notify(wasFavorite ? "Удалено из избранного" : "Добавлено в избранное");
    },
    [notify],
  );

  const isFavorite = useCallback(
    (productId: string) => favorites.includes(productId),
    [favorites],
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, line) => sum + line.qty, 0),
    [cart],
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      cart,
      favorites,
      cartCount,
      addToCart,
      setQty,
      removeFromCart,
      clearCart,
      toggleFavorite,
      isFavorite,
    }),
    [
      cart,
      favorites,
      cartCount,
      addToCart,
      setQty,
      removeFromCart,
      clearCart,
      toggleFavorite,
      isFavorite,
    ],
  );

  return (
    <StoreContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-[60] flex justify-center px-4 md:bottom-6"
      >
        {toast ? (
          <div className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 text-sm font-medium text-white shadow-float">
            <span className="flex size-5 items-center justify-center rounded-full bg-white/15 text-white">
              <Icon name="check" className="size-3.5" strokeWidth={2.5} />
            </span>
            {toast}
          </div>
        ) : null}
      </div>
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore должен использоваться внутри StoreProvider");
  }
  return context;
}
