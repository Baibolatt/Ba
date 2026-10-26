import { NextResponse } from "next/server";
import {
  buildAssistantSystemPrompt,
  buildCatalogContext,
  extractMentionedProducts,
  parseAssistantMessages,
  selectAssistantProducts,
  toAssistantProduct,
  trimAssistantHistory,
  type AssistantPageContext,
} from "@/lib/assistant";
import {
  getCategories,
  getCategory,
  getProduct,
  getProducts,
} from "@/lib/data";
import { hasDeepSeekKey, requestAssistantReply } from "@/lib/deepseek";
import { checkRateLimit, clientAddress } from "@/lib/rate-limit";

const MAX_BODY_BYTES = 512_000;
const RATE_LIMIT = 15;
const RATE_WINDOW_MS = 60_000;

type AssistantRequestBody = {
  messages?: unknown;
  page?: unknown;
};

function json(
  body: unknown,
  status = 200,
  headers: Record<string, string> = {},
) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...headers },
  });
}

function errorResponse(
  status: number,
  code: string,
  message: string,
  retryAfterSeconds?: number,
) {
  return json(
    {
      error: code,
      message,
      ...(retryAfterSeconds ? { retryAfterSeconds } : {}),
    },
    status,
    retryAfterSeconds
      ? { "Retry-After": String(retryAfterSeconds) }
      : undefined,
  );
}

const unavailableMessage =
  "ИИ-консультант временно недоступен. Попробуйте найти деталь через поиск по каталогу или напишите нам.";

/**
 * Контекст открытой страницы помогает, когда покупатель спрашивает про
 * конкретный товар или категорию. Ошибки чтения контекста не должны ломать
 * сам чат — в этом случае просто работаем без подсказки.
 */
async function loadPageContext(rawPage: string): Promise<AssistantPageContext> {
  const empty: AssistantPageContext = { note: "", product: null };
  if (!rawPage || rawPage.length > 300 || !rawPage.startsWith("/")) {
    return empty;
  }

  let url: URL;
  try {
    url = new URL(rawPage, "https://partshub.local");
  } catch {
    return empty;
  }

  try {
    const productMatch = /^\/product\/([^/]+)\/?$/.exec(url.pathname);
    if (productMatch) {
      const product = await getProduct(
        decodeURIComponent(productMatch[1]),
      );
      if (product) {
        return {
          note: `Покупатель открыл карточку товара ${product.name} (арт. ${product.article}).`,
          product,
        };
      }
    }

    const categoryMatch = /^\/catalog\/([^/]+)\/?$/.exec(url.pathname);
    if (categoryMatch) {
      const category = await getCategory(
        decodeURIComponent(categoryMatch[1]),
      );
      if (category) {
        return {
          note: `Покупатель находится в категории «${category.name}» (${category.productCount} товаров).`,
          product: null,
        };
      }
    }

    if (url.pathname === "/search") {
      const query = url.searchParams.get("q")?.trim();
      if (query) {
        return {
          note: `Покупатель искал «${query.slice(0, 100)}».`,
          product: null,
        };
      }
    }

    if (url.pathname === "/") {
      return { note: "Покупатель на главной странице.", product: null };
    }
  } catch {
    return empty;
  }

  return empty;
}

export async function POST(request: Request) {
  const contentLength = Number(
    request.headers.get("content-length") ?? "0",
  );

  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return errorResponse(
      413,
      "payload_too_large",
      "Сообщение слишком большое. Сократите его и попробуйте снова.",
    );
  }

  let body: AssistantRequestBody;
  try {
    const parsed: unknown = await request.json();
    if (!parsed || typeof parsed !== "object") {
      return errorResponse(
        400,
        "invalid_request",
        "Не удалось прочитать сообщение.",
      );
    }
    body = parsed as AssistantRequestBody;
  } catch {
    return errorResponse(
      400,
      "invalid_request",
      "Не удалось прочитать сообщение.",
    );
  }

  const messages = parseAssistantMessages(body.messages);
  if (!messages) {
    return errorResponse(
      400,
      "invalid_request",
      "История диалога пуста или содержит слишком длинное сообщение.",
    );
  }

  if (!hasDeepSeekKey()) {
    return errorResponse(503, "unavailable", unavailableMessage);
  }

  const address = await clientAddress();
  const limit = checkRateLimit(
    `ai-assistant:${address}`,
    RATE_LIMIT,
    RATE_WINDOW_MS,
  );

  if (!limit.allowed) {
    const minutes = Math.max(
      1,
      Math.ceil(limit.retryAfterSeconds / 60),
    );

    return errorResponse(
      429,
      "rate_limited",
      `Слишком много сообщений. Повторите через ${minutes} мин.`,
      limit.retryAfterSeconds,
    );
  }

  try {
    const history = trimAssistantHistory(messages);
    const rawPage = typeof body.page === "string" ? body.page : "";
    const [products, categories, pageContext] = await Promise.all([
      getProducts(),
      getCategories(),
      loadPageContext(rawPage),
    ]);

    const relevant = selectAssistantProducts(
      products,
      history,
      pageContext.product,
    );
    const catalogContext = buildCatalogContext(
      relevant,
      categories,
      pageContext.note,
    );
    const systemPrompt = buildAssistantSystemPrompt(catalogContext);
    const reply = await requestAssistantReply(history, systemPrompt);

    if (!reply) {
      return errorResponse(503, "unavailable", unavailableMessage);
    }

    const mentioned = extractMentionedProducts(reply, products).map(
      toAssistantProduct,
    );

    return json({ reply, products: mentioned });
  } catch {
    // Внутренние ошибки БД и сети не показываем клиенту.
    return errorResponse(
      500,
      "internal",
      "Не удалось получить ответ. Попробуйте ещё раз.",
    );
  }
}
