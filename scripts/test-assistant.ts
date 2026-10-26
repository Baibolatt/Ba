import {
  assistantSearchQuery,
  buildAssistantSystemPrompt,
  buildCatalogContext,
  extractMentionedProducts,
  parseAssistantMessages,
  selectAssistantProducts,
  toAssistantProduct,
  trimAssistantHistory,
  type AssistantMessage,
} from "../src/lib/assistant";
import { requestAssistantReply } from "../src/lib/deepseek";
import type { Category, Product } from "../src/lib/types";

let checks = 0;

function check(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Проверка не прошла: ${message}`);
  }
  checks += 1;
}

function equal(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    throw new Error(
      `Проверка не прошла: ${message}\n  ожидалось: ${String(expected)}\n  получено:  ${String(actual)}`,
    );
  }
  checks += 1;
}

function equalJson(actual: unknown, expected: unknown, message: string) {
  const actualJson = JSON.stringify(actual);
  const expectedJson = JSON.stringify(expected);

  if (actualJson !== expectedJson) {
    throw new Error(
      `Проверка не прошла: ${message}\n  ожидалось: ${expectedJson}\n  получено:  ${actualJson}`,
    );
  }
  checks += 1;
}

function product(
  overrides: Partial<Product> & Pick<Product, "id" | "article" | "name">,
): Product {
  return {
    brand: "Тестовый бренд",
    categorySlug: "filters",
    categoryName: "Фильтры",
    categoryIcon: "filter",
    price: 1_000,
    quantity: 1,
    inStock: true,
    unit: "шт.",
    description: "",
    compatibility: "",
    specs: [],
    ...overrides,
  };
}

async function main() {
  const categories: Category[] = [
    {
      id: "c-filters",
      slug: "filters",
      name: "Фильтры",
      shortName: "Фильтры",
      description: "Масляные, воздушные и топливные фильтры",
      icon: "filter",
      sortOrder: 0,
      productCount: 3,
    },
    {
      id: "c-oils",
      slug: "oils",
      name: "Масла и жидкости",
      shortName: "Масла",
      description: "Моторные масла",
      icon: "droplet",
      sortOrder: 1,
      productCount: 1,
    },
  ];

  const filter = product({
    id: "p-filter",
    article: "GF-1042",
    name: "Фильтр масляный",
    brand: "ГрандФильтр",
    price: 2_200,
    quantity: 56,
    compatibility: "Toyota Camry 2018–2024",
    specs: [{ label: "Тип", value: "Масляный" }],
  });
  const oil = product({
    id: "p-oil",
    article: "OP-540",
    name: "Масло моторное 5W-40, 4 л",
    brand: "ОйлПро",
    categorySlug: "oils",
    categoryName: "Масла и жидкости",
    categoryIcon: "droplet",
    price: 14_900,
    quantity: 32,
    compatibility: "Toyota Camry 2018–2024",
  });
  const brake = product({
    id: "p-brake",
    article: "TL-2418",
    name: "Колодки тормозные передние",
    brand: "ТормоПро",
    categorySlug: "brakes",
    categoryName: "Тормозная система",
    categoryIcon: "brake",
    price: 8_900,
    quantity: 12,
    compatibility: "Toyota Camry 2018–2024",
  });

  // Разбор истории диалога.
  const valid = parseAssistantMessages([
    { role: "user", content: "  Привет " },
    { role: "assistant", content: "Здравствуйте" },
    { role: "user", content: "Нужен фильтр" },
  ]);
  check(valid, "история: валидные сообщения приняты");
  equal(valid.length, 3, "история: все сообщения сохранены");
  equal(valid[0]?.content, "Привет", "история: пробелы обрезаны");

  equal(parseAssistantMessages([]), null, "история: пустой массив отклонён");
  equal(
    parseAssistantMessages([{ role: "system", content: "x" }]),
    null,
    "история: неизвестная роль отклонена",
  );
  equal(
    parseAssistantMessages([
      { role: "user", content: "вопрос" },
      { role: "assistant", content: "ответ" },
    ]),
    null,
    "история: последнее сообщение должно быть от покупателя",
  );
  equal(
    parseAssistantMessages([{ role: "user", content: "   " }]),
    null,
    "история: пустое сообщение отклонено",
  );
  equal(
    parseAssistantMessages([
      { role: "user", content: "x".repeat(2_001) },
    ]),
    null,
    "история: слишком длинное сообщение покупателя отклонено",
  );
  equal(
    parseAssistantMessages([
      { role: "user", content: "вопрос" },
      { role: "assistant", content: "x".repeat(6_001) },
      { role: "user", content: "ещё вопрос" },
    ]),
    null,
    "история: слишком длинный ответ ассистента отклонён",
  );

  // Обрезка истории.
  const longHistory: AssistantMessage[] = [];
  for (let index = 0; index < 20; index += 1) {
    longHistory.push({ role: "user", content: `user-${index}` });
    longHistory.push({ role: "assistant", content: `assistant-${index}` });
  }
  longHistory.push({ role: "user", content: "последний вопрос" });

  const trimmed = trimAssistantHistory(longHistory);
  check(trimmed.length <= 30, "обрезка: не больше 30 сообщений");
  equal(trimmed[0]?.role, "user", "обрезка: начинается с вопроса");
  equal(
    trimmed[trimmed.length - 1]?.content,
    "последний вопрос",
    "обрезка: последняя реплика сохранена",
  );

  const bulky: AssistantMessage[] = Array.from(
    { length: 7 },
    (_, index) => ({
      role: index % 2 === 0 ? "user" : "assistant",
      content: `${index}-${"x".repeat(999)}`,
    }),
  );
  bulky.push({ role: "user", content: "last" });

  const short = trimAssistantHistory(bulky, 10, 2_500);
  const shortChars = short.reduce(
    (sum, message) => sum + message.content.length,
    0,
  );
  check(shortChars <= 2_500, "обрезка: лимит символов соблюдён");
  equal(
    short[short.length - 1]?.content,
    "last",
    "обрезка: короткая последняя реплика сохранена",
  );

  // Выбор товаров для контекста.
  equal(
    assistantSearchQuery([
      { role: "user", content: "масляный фильтр" },
      { role: "assistant", content: "Уточните автомобиль" },
      { role: "user", content: "а масло?" },
    ]),
    "масляный фильтр а масло?",
    "поиск: короткая реплика дополнена предыдущей",
  );

  const selected = selectAssistantProducts(
    [filter, oil, brake],
    [{ role: "user", content: "масляный фильтр" }],
  );
  equal(
    selected[0]?.article,
    "GF-1042",
    "контекст: найден масляный фильтр",
  );

  const followUp = selectAssistantProducts(
    [filter, oil, brake],
    [
      { role: "user", content: "масляный фильтр" },
      { role: "assistant", content: "Есть GF-1042" },
      { role: "user", content: "а сколько стоит?" },
    ],
  );
  check(
    followUp.some((item) => item.article === "GF-1042"),
    "контекст: вопрос о цене сохраняет предыдущий товар",
  );

  const withPageProduct = selectAssistantProducts(
    [filter, oil, brake],
    [{ role: "user", content: "масляный фильтр" }],
    brake,
  );
  equal(
    withPageProduct[0]?.article,
    "TL-2418",
    "контекст: товар со страницы идёт первым",
  );
  check(
    withPageProduct.some((item) => item.article === "GF-1042"),
    "контекст: найденный фильтр не потерян",
  );

  const manyProducts = Array.from({ length: 20 }, (_, index) =>
    product({
      id: `many-${index}`,
      article: `MANY-${index}`,
      name: `Товар ${index}`,
    }),
  );
  check(
    selectAssistantProducts(
      manyProducts,
      [{ role: "user", content: "товар" }],
    ).length <= 20,
    "контекст: в промпт попадает не больше 20 товаров",
  );

  // Текст промпта.
  const catalogContext = buildCatalogContext(
    [filter, oil],
    categories,
    "Покупатель в категории «Фильтры».",
  );
  check(
    catalogContext.includes("GF-1042") &&
      catalogContext.includes("Фильтр масляный") &&
      catalogContext.includes("56 шт.") &&
      catalogContext.includes("Toyota Camry") &&
      catalogContext.includes("Покупатель в категории"),
    "промпт: в контекст попали товар, остаток, совместимость и страница",
  );
  check(
    catalogContext.includes("₸"),
    "промпт: цена указана в тенге",
  );

  const systemPrompt = buildAssistantSystemPrompt(catalogContext);
  check(
    systemPrompt.includes("PartsHub") &&
      systemPrompt.includes("Не выдумывай") &&
      systemPrompt.includes("GF-1042"),
    "промпт: правила и каталог объединены",
  );

  // Извлечение упомянутых товаров.
  equalJson(
    extractMentionedProducts(
      "Советую [GF-1042] — фильтр. Ещё можно посмотреть OP-540. ZZ-9999 не существует.",
      [filter, oil, brake],
    ).map((item) => item.article),
    ["GF-1042", "OP-540"],
    "ответ: известные артикулы найдены, выдуманный отброшен",
  );
  equalJson(
    extractMentionedProducts("Берите [ZZ-9999]", [filter, oil]),
    [],
    "ответ: выдуманный артикул не превращается в товар",
  );

  const numeric = product({
    id: "p-numeric",
    article: "1042",
    name: "Деталь с цифровым артикулом",
  });
  equalJson(
    extractMentionedProducts("Подходит артикул [1042]", [numeric]).map(
      (item) => item.article,
    ),
    ["1042"],
    "ответ: цифровой артикул в скобках распознан",
  );

  const manyMentioned = Array.from({ length: 8 }, (_, index) =>
    product({
      id: `mention-${index}`,
      article: `AA-100${index}`,
      name: `Товар ${index}`,
    }),
  );
  equal(
    extractMentionedProducts(
      manyMentioned.map((item) => `[${item.article}]`).join(" "),
      manyMentioned,
    ).length,
    6,
    "ответ: карточек товара не больше шести",
  );

  equalJson(
    toAssistantProduct(filter),
    {
      id: "p-filter",
      article: "GF-1042",
      name: "Фильтр масляный",
      brand: "ГрандФильтр",
      price: 2_200,
      inStock: true,
      quantity: 56,
    },
    "товар для клиента: поля сохранены",
  );

  // Клиент DeepSeek: без ключа сеть не вызывается.
  const originalKey = process.env.DEEPSEEK_API_KEY;
  const originalFetch = globalThis.fetch;

  try {
    delete process.env.DEEPSEEK_API_KEY;
    let fetchCalls = 0;

    globalThis.fetch = (async () => {
      fetchCalls += 1;
      throw new Error("Без ключа запрос не должен выполняться");
    }) as typeof fetch;

    equal(
      await requestAssistantReply(
        [{ role: "user", content: "Нужен фильтр" }],
        "Системный промпт",
      ),
      null,
      "клиент ИИ: без ключа возвращается null",
    );
    equal(fetchCalls, 0, "клиент ИИ: без ключа сеть не вызывается");

    process.env.DEEPSEEK_API_KEY = "test-key";
    let requestBody: Record<string, unknown> | null = null;

    globalThis.fetch = (async (_input, init) => {
      fetchCalls += 1;
      requestBody = init?.body
        ? (JSON.parse(String(init.body)) as Record<string, unknown>)
        : null;

      return new Response(
        JSON.stringify({
          choices: [{ message: { content: "  Ответ консультанта  " } }],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }) as typeof fetch;

    equal(
      await requestAssistantReply(
        [{ role: "user", content: "Нужен фильтр" }],
        "Системный промпт",
      ),
      "Ответ консультанта",
      "клиент ИИ: ответ очищен от пробелов",
    );
    equal(fetchCalls, 1, "клиент ИИ: запрос отправлен один раз");
    check(requestBody, "клиент ИИ: тело запроса сформировано");

    const payload = requestBody as {
      messages?: Array<{ role: string; content: string }>;
      temperature?: number;
      max_tokens?: number;
      stream?: boolean;
    };

    equal(
      payload.messages?.[0]?.role,
      "system",
      "клиент ИИ: системный промпт первый",
    );
    equal(
      payload.messages?.[0]?.content,
      "Системный промпт",
      "клиент ИИ: системный промпт передан",
    );
    equal(
      payload.messages?.[1]?.content,
      "Нужен фильтр",
      "клиент ИИ: история диалога передана",
    );
    equal(payload.temperature, 0.4, "клиент ИИ: температура диалога");
    equal(payload.max_tokens, 1_000, "клиент ИИ: лимит ответа");
    equal(payload.stream, false, "клиент ИИ: ответ не стримится");

    globalThis.fetch = (async () =>
      new Response("error", { status: 500 })) as typeof fetch;
    equal(
      await requestAssistantReply(
        [{ role: "user", content: "Нужен фильтр" }],
        "Системный промпт",
      ),
      null,
      "клиент ИИ: ошибка HTTP даёт null",
    );

    globalThis.fetch = (async () => {
      throw new Error("DeepSeek недоступен");
    }) as typeof fetch;
    equal(
      await requestAssistantReply(
        [{ role: "user", content: "Нужен фильтр" }],
        "Системный промпт",
      ),
      null,
      "клиент ИИ: ошибка сети даёт null",
    );

    console.log(`\nВсе проверки пройдены: ${checks}.`);
  } finally {
    globalThis.fetch = originalFetch;

    if (originalKey === undefined) {
      delete process.env.DEEPSEEK_API_KEY;
    } else {
      process.env.DEEPSEEK_API_KEY = originalKey;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
