import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { StoreProvider } from "@/components/providers/store-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { BottomNav } from "@/components/layout/bottom-nav";

export const metadata: Metadata = {
  title: {
    default: "PartsHub — автозапчасти со склада",
    template: "%s — PartsHub",
  },
  description:
    "PartsHub — оптовый склад автозапчастей: каталог, наличие, самовывоз и доставка по области.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ru" className="h-full">
      <body className="flex min-h-full flex-col pb-16 md:pb-0">
        <StoreProvider>
          <a
            href="#content"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-control focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
          >
            Перейти к содержимому
          </a>
          <Header />
          <main id="content" className="flex-1">
            {children}
          </main>
          <Footer />
          <BottomNav />
        </StoreProvider>
      </body>
    </html>
  );
}
