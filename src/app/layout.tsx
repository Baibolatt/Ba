import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import "./globals.css";
import { StoreProvider } from "@/components/providers/store-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";
import { AssistantWidget } from "@/components/assistant/assistant-widget";
import { getCategories } from "@/lib/data";

export const metadata: Metadata = {
  title: {
    default: "PartsHub — автозапчасти со склада",
    template: "%s — PartsHub",
  },
  description:
    "PartsHub — оптовый склад автозапчастей: каталог, наличие, самовывоз и доставка по области.",
};

export default async function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const categories = await getCategories();

  return (
    <html lang="ru" className="h-full">
      <body className="flex min-h-full flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] lg:pb-0">
        <StoreProvider>
          <a
            href="#content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-control focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
          >
            Перейти к содержимому
          </a>
          <Suspense
            fallback={
              <div className="h-[7.25rem] border-b border-line bg-surface lg:h-[72px]" />
            }
          >
            <Header categories={categories} />
          </Suspense>
          <main id="content" className="flex-1">
            {children}
          </main>
          <Footer categories={categories} />
          <Suspense
            fallback={
              <div className="h-16 border-t border-line bg-surface lg:hidden" />
            }
          >
            <BottomNav />
          </Suspense>
          <Suspense fallback={null}>
            <AssistantWidget />
          </Suspense>
        </StoreProvider>
      </body>
    </html>
  );
}
