"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
} from "react";
import { formatPrice } from "@/lib/format";
import type { AssistantProduct } from "@/lib/types";
import { Icon } from "@/components/ui/icon";

const STORAGE_KEY = "partshub_assistant_v1";
const MAX_STORED_MESSAGES = 40;
const MAX_SENT_MESSAGES = 30;
const MAX_MESSAGE_LENGTH = 2_000;
const MAX_ASSISTANT_MESSAGE_LENGTH = 6_000;

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  products?: AssistantProduct[];
  error?: boolean;
};

const suggestions = [
  "Подбери масляный фильтр на Toyota Camry 2018",
  "Какие тормозные колодки есть в наличии?",
  "Чем отличается синтетическое масло от полусинтетического?",
];

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object";
}

function parseProducts(value: unknown): AssistantProduct[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const products: AssistantProduct[] = [];

  for (const item of value.slice(0, 6)) {
    if (!isRecord(item)) continue;

    const { id, article, name, brand, price, inStock, quantity } = item;

    if (
      typeof id !== "string" ||
      typeof article !== "string" ||
      typeof name !== "string" ||
      typeof brand !== "string" ||
      typeof price !== "number" ||
      !Number.isFinite(price) ||
      typeof inStock !== "boolean" ||
      typeof quantity !== "number" ||
      !Number.isFinite(quantity)
    ) {
      continue;
    }

    products.push({
      id,
      article,
      name,
      brand,
      price,
      inStock,
      quantity,
    });
  }

  return products.length > 0 ? products : undefined;
}

function parseStoredMessages(raw: string | null): ChatMessage[] {
  if (!raw) return [];

  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];

    const messages: ChatMessage[] = [];

    for (const item of value.slice(-MAX_STORED_MESSAGES)) {
      if (!isRecord(item)) continue;

      const role = item.role;
      const content = item.content;

      if (
        (role !== "user" && role !== "assistant") ||
        typeof content !== "string"
      ) {
        continue;
      }

      const trimmed = content.trim();
      if (!trimmed) continue;

      const limit =
        role === "user"
          ? MAX_MESSAGE_LENGTH
          : MAX_ASSISTANT_MESSAGE_LENGTH;

      messages.push({
        id: typeof item.id === "string" ? item.id : createId(),
        role,
        content: trimmed.slice(0, limit),
        products: parseProducts(item.products),
        error: item.error === true,
      });
    }

    return messages.slice(-MAX_STORED_MESSAGES);
  } catch {
    return [];
  }
}

function readStoredMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];

  try {
    return parseStoredMessages(
      window.localStorage.getItem(STORAGE_KEY),
    );
  } catch {
    return [];
  }
}

export function AssistantWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(
    readStoredMessages,
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)),
      );
    } catch {
      // Приватный режим или переполненное хранилище: история живёт в памяти.
    }
  }, [messages]);

  useEffect(() => {
    if (!open) return;

    inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, loading, open]);

  const sendMessage = async (raw: string) => {
    const content = raw.trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!content || loading) return;

    const userMessage: ChatMessage = {
      id: createId(),
      role: "user",
      content,
    };
    const history = [...messages, userMessage]
      .filter((message) => !message.error)
      .map(({ role, content: text }) => ({ role, content: text }))
      .slice(-MAX_SENT_MESSAGES);

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setLoading(true);

    let failureMessage =
      "Не удалось получить ответ. Проверьте соединение и попробуйте ещё раз.";

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history,
          page: `${window.location.pathname}${window.location.search}`,
        }),
        signal: AbortSignal.timeout(35_000),
      });
      const data: unknown = await response.json().catch(() => null);
      const record = isRecord(data) ? data : null;
      const reply =
        record && typeof record.reply === "string" ? record.reply : "";

      if (!response.ok || !record || !reply.trim()) {
        failureMessage =
          record && typeof record.message === "string"
            ? record.message
            : failureMessage;

        throw new Error("assistant-request-failed");
      }

      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          content: reply
            .trim()
            .slice(0, MAX_ASSISTANT_MESSAGE_LENGTH),
          products: parseProducts(record.products),
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: createId(),
          role: "assistant",
          content: failureMessage,
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const onInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      void sendMessage(input);
    }
  };

  const clear = () => {
    if (messages.length === 0) return;
    if (!window.confirm("Очистить историю диалога?")) return;

    setMessages([]);
    setInput("");
  };

  // В оформлении заказа и корзине важнее кнопка оплаты, поэтому консультант
  // не перекрывает итоговую панель.
  if (
    pathname.startsWith("/admin") ||
    pathname === "/cart" ||
    pathname.startsWith("/checkout")
  ) {
    return null;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Открыть ИИ-консультанта по подбору запчастей"
        className="fixed bottom-[calc(4.75rem+env(safe-area-inset-bottom))] right-4 z-50 flex h-12 w-12 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-brand px-0 text-sm font-semibold text-white shadow-float transition-colors hover:bg-brand-800 sm:w-auto sm:px-4 lg:bottom-6 lg:right-6"
      >
        <Icon name="sparkles" className="size-5" />
        <span className="hidden sm:inline">Подобрать с ИИ</span>
      </button>
    );
  }

  return (
    <section
      id="parts-assistant"
      role="dialog"
      aria-labelledby="parts-assistant-title"
      className="fixed inset-x-3 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-50 flex h-[min(72dvh,560px)] flex-col overflow-hidden rounded-sheet border border-line bg-surface shadow-float lg:inset-x-auto lg:bottom-6 lg:right-6 lg:w-[380px]"
    >
      <header className="flex items-start justify-between gap-3 border-b border-line px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-brand">
            <Icon name="sparkles" className="size-5" />
          </span>
          <div className="min-w-0">
            <p
              id="parts-assistant-title"
              className="truncate text-sm font-bold text-ink"
            >
              ИИ-консультант
            </p>
            <p className="truncate text-[11px] text-muted">
              Подбор запчастей по вашему автомобилю
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-0.5">
          {messages.length > 0 ? (
            <button
              type="button"
              onClick={clear}
              aria-label="Очистить историю диалога"
              title="Очистить диалог"
              className="flex size-9 items-center justify-center rounded-control text-icon transition-colors hover:bg-brand-50 hover:text-ink"
            >
              <Icon name="trash" className="size-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Закрыть ИИ-консультанта"
            className="flex size-9 items-center justify-center rounded-control text-icon transition-colors hover:bg-brand-50 hover:text-ink"
          >
            <Icon name="close" className="size-5" />
          </button>
        </div>
      </header>

      <div
        ref={listRef}
        role="log"
        aria-live="polite"
        aria-label="Диалог с ИИ-консультантом"
        className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4"
      >
        {messages.length === 0 ? (
          <div className="flex h-full flex-col justify-center gap-4">
            <div className="text-center">
              <span className="mx-auto flex size-12 items-center justify-center rounded-full bg-brand-50 text-brand">
                <Icon name="sparkles" className="size-6" />
              </span>
              <p className="mt-3 text-sm font-bold text-ink">
                Помогу подобрать запчасть
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                Напишите марку, модель и год автомобиля. Могу также
                объяснить, чем отличаются детали.
              </p>
            </div>

            <div className="space-y-2">
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => void sendMessage(suggestion)}
                  className="w-full rounded-control border border-line bg-surface px-3 py-2.5 text-left text-xs font-medium text-ink transition-colors hover:border-brand/40 hover:bg-brand-50"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === "user"
                  ? "flex justify-end"
                  : "flex justify-start"
              }
            >
              <div
                className={[
                  "max-w-[90%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
                  message.role === "user"
                    ? "bg-brand text-white"
                    : message.error
                      ? "border border-danger/20 bg-danger-soft text-danger"
                      : "bg-page text-ink",
                ].join(" ")}
              >
                <p className="whitespace-pre-wrap break-words">
                  {message.content}
                </p>

                {message.products?.length ? (
                  <div className="mt-2.5 space-y-2">
                    {message.products.map((product) => (
                      <Link
                        key={product.id}
                        href={`/product/${product.id}`}
                        onClick={() => setOpen(false)}
                        className="block rounded-control border border-line bg-surface p-2.5 transition-colors hover:border-brand/40"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="line-clamp-2 text-xs font-semibold text-ink">
                              {product.name}
                            </p>
                            <p className="mt-0.5 text-[11px] text-muted">
                              Арт. {product.article} · {product.brand}
                            </p>
                          </div>
                          <p className="shrink-0 text-xs font-bold text-brand">
                            {formatPrice(product.price)}
                          </p>
                        </div>
                        <p className="mt-1.5 text-[11px] text-muted">
                          {product.inStock
                            ? `В наличии: ${product.quantity}`
                            : "Нет в наличии"}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : null}

                {message.error ? (
                  <Link
                    href="/search"
                    onClick={() => setOpen(false)}
                    className="mt-2 inline-flex text-xs font-semibold text-danger underline underline-offset-2"
                  >
                    Перейти к поиску
                  </Link>
                ) : null}
              </div>
            </div>
          ))
        )}

        {loading ? (
          <div className="flex justify-start">
            <div className="rounded-2xl bg-page px-3.5 py-2.5 text-xs text-muted">
              Подбираю ответ…
            </div>
          </div>
        ) : null}
      </div>

      <form onSubmit={submit} className="border-t border-line bg-surface p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={onInputKeyDown}
            rows={2}
            maxLength={MAX_MESSAGE_LENGTH}
            disabled={loading}
            placeholder="Например: нужен масляный фильтр на Camry 2018"
            aria-label="Сообщение ИИ-консультанту"
            className="max-h-28 min-h-11 flex-1 resize-none rounded-control border border-line bg-page px-3 py-2.5 text-sm text-ink placeholder:text-muted/80 focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            aria-label="Отправить сообщение"
            className="flex size-11 shrink-0 items-center justify-center rounded-control bg-brand text-white transition-colors hover:bg-brand-800 disabled:pointer-events-none disabled:opacity-40"
          >
            <Icon name="send" className="size-5" />
          </button>
        </div>
        <p className="mt-2 text-[10px] leading-snug text-muted">
          ИИ может ошибаться. Наличие и цену проверяйте в карточке товара.
        </p>
      </form>
    </section>
  );
}
