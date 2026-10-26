import { Container } from "@/components/layout/container";

export default function Loading() {
  return (
    <Container className="py-5 sm:py-8">
      <span className="sr-only">Загрузка страницы…</span>
      <div aria-hidden="true">
        <div className="h-3.5 w-40 animate-pulse rounded bg-surface" />
        <div className="mt-4 h-9 w-64 max-w-full animate-pulse rounded bg-surface" />
        <div className="mt-2 h-4 w-80 max-w-full animate-pulse rounded bg-surface" />
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-card bg-surface"
            />
          ))}
        </div>
      </div>
    </Container>
  );
}
