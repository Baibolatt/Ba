"use client";

import { useEffect } from "react";
import { Container } from "@/components/layout/container";
import { Button, ButtonLink } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Ошибка страницы", error);
  }, [error]);

  return (
    <Container className="py-5 sm:py-8">
      <section className="mx-auto mt-8 max-w-lg rounded-card border border-line bg-surface p-5 text-center shadow-card sm:p-8">
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-danger-soft text-danger">
          <Icon name="alertCircle" className="size-8" />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
          Что-то пошло не так
        </h1>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted">
          Не удалось загрузить страницу. Попробуйте ещё раз — если ошибка
          повторится, вернитесь чуть позже.
        </p>
        {error.digest ? (
          <p className="mt-3 text-[11px] text-muted">
            Код ошибки: <span className="font-mono">{error.digest}</span>
          </p>
        ) : null}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button type="button" onClick={reset} variant="primary">
            Попробовать снова
          </Button>
          <ButtonLink href="/" variant="secondary">
            На главную
          </ButtonLink>
        </div>
      </section>
    </Container>
  );
}
