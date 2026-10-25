"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
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

// Демо-состояние: корзина и избранное живут в памяти до этапа с БД.
const initialCart: CartLine[] = [
  { productId: "tl-2418", qty: 2 },
  { productId: "gf-1042", qty: 1 },
];

const initialFavorites = ["ae-5520", "op-540", "ae-7701"];

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>(initialCart);
  const [favorites, setFavorites] = useState<string[]>(initialFavorites);
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
      setCart((current) => {
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
    setCart((current) =>
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
    setCart((current) => current.filter((line) => line.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const toggleFavorite = useCallback(
    (productId: string) => {
      setFavorites((current) => {
        if (current.includes(productId)) {
          notify("Удалено из избранного");
          return current.filter((id) => id !== productId);
        }
        notify("Добавлено в избранное");
        return [...current, productId];
      });
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
          <div className="flex items-center gap-2 rounded-full bg-brand px-4 py-2.5 text-sm font-medium text-white shadow-float">
            <span className="flex size-5 items-center justify-center rounded-full bg-accent text-brand">
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
