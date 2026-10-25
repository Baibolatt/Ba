import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "PartsHub",
    template: "%s — PartsHub",
  },
  description: "Каталог автозапчастей PartsHub",
};

export default function RootLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="ru" className="h-full">
      <body className="flex min-h-full flex-col bg-zinc-50 text-zinc-900">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-8 px-4">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              PartsHub
            </Link>
            <nav className="flex items-center gap-6 text-sm text-zinc-600">
              <Link href="/" className="transition-colors hover:text-zinc-900">
                Главная
              </Link>
              <Link
                href="/catalog"
                className="transition-colors hover:text-zinc-900"
              >
                Каталог
              </Link>
            </nav>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
          {children}
        </main>

        <footer className="border-t border-zinc-200 bg-white">
          <div className="mx-auto w-full max-w-6xl px-4 py-6 text-sm text-zinc-500">
            © PartsHub
          </div>
        </footer>
      </body>
    </html>
  );
}
