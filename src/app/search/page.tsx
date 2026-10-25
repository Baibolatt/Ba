import type { Metadata } from "next";
import { Suspense } from "react";
import { Container } from "@/components/layout/container";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { SearchView } from "@/components/search/search-view";
import { searchProducts } from "@/lib/data";

export const metadata: Metadata = {
  title: "Поиск",
  description: "Поиск автозапчастей по названию, артикулу и бренду.",
};

type SearchPageProps = {
  searchParams: Promise<{ q?: string | string[] }>;
};

async function SearchResults({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = typeof q === "string" ? q.trim() : "";
  const results = await searchProducts(query);

  return <SearchView query={query} results={results} />;
}

export default function SearchPage({ searchParams }: SearchPageProps) {
  return (
    <Container className="py-5 sm:py-8">
      <Breadcrumbs items={[{ label: "Главная", href: "/" }, { label: "Поиск" }]} />

      <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
        Поиск запчастей
      </h1>
      <p className="mt-1.5 text-sm text-muted">
        Ищите по названию, артикулу или бренду. Например, «TL-2418» или
        «масляный фильтр».
      </p>

      <Suspense
        fallback={
          <div className="mt-4 h-12 w-full animate-pulse rounded-control bg-surface" />
        }
      >
        <SearchResults searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}
