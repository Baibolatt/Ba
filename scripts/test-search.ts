import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  findMatchingArticles,
  parseDeepSeekArticles,
} from "../src/lib/deepseek";
import {
  findProductHits,
  needsAi,
  selectResults,
  topCandidates,
} from "../src/lib/search-match";

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

async function main() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "partshub-search-"));
  const dbUrl = `file:${path.join(tempDir, "test.db")}`;
  const originalDeepSeekKey = process.env.DEEPSEEK_API_KEY;
  const originalFetch = globalThis.fetch;

  console.log("Готовлю временную базу SQLite…");
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: "pipe",
  });

  const prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: dbUrl }),
  });

  try {
    const filters = await prisma.category.create({
      data: {
        slug: "filters",
        name: "Фильтры",
        shortName: "Фильтры",
        description: "Масляные, воздушные и топливные фильтры",
        icon: "filter",
        sortOrder: 0,
      },
    });
    const oils = await prisma.category.create({
      data: {
        slug: "oils",
        name: "Масла и жидкости",
        shortName: "Масла",
        description: "Моторные масла и антифризы",
        icon: "droplet",
        sortOrder: 1,
      },
    });
    const brakes = await prisma.category.create({
      data: {
        slug: "brakes",
        name: "Тормозная система",
        shortName: "Тормоза",
        description: "Колодки и диски",
        icon: "brake",
        sortOrder: 2,
      },
    });
    const other = await prisma.category.create({
      data: {
        slug: "other",
        name: "Прочее",
        shortName: "Прочее",
        description: "Прочие позиции склада",
        icon: "gear",
        sortOrder: 3,
      },
    });
    const filterBrand = await prisma.brand.create({
      data: { name: "ГрандФильтр" },
    });
    const oilBrand = await prisma.brand.create({ data: { name: "ОйлПро" } });
    const brakeBrand = await prisma.brand.create({ data: { name: "ТормоПро" } });
    const otherBrand = await prisma.brand.create({ data: { name: "Прочее" } });

    await prisma.product.create({
      data: {
        article: "GF-1042",
        name: "Фильтр масляный",
        brandId: filterBrand.id,
        categoryId: filters.id,
        price: 2_200,
        quantity: 56,
        description:
          "Масляный фильтр с многослойной фильтрующей бумагой и обратным клапаном.",
        compatibility: "Toyota, Hyundai, Kia — двигатели 1.6–2.5",
        sortOrder: 0,
        specs: {
          create: [{ label: "Тип", value: "Масляный", sortOrder: 0 }],
        },
      },
    });
    await prisma.product.create({
      data: {
        article: "GF-2205",
        name: "Фильтр воздушный панельный",
        brandId: filterBrand.id,
        categoryId: filters.id,
        price: 4_500,
        quantity: 14,
        description: "Панельный воздушный фильтр с высокой пылеёмкостью.",
        compatibility: "Toyota Camry, Corolla",
        sortOrder: 1,
      },
    });
    await prisma.product.create({
      data: {
        article: "GF-3300",
        name: "Фильтр топливный",
        brandId: filterBrand.id,
        categoryId: filters.id,
        price: 3_100,
        quantity: 9,
        description: "Топливный фильтр тонкой очистки.",
        compatibility: "Hyundai, Kia",
        sortOrder: 2,
      },
    });
    await prisma.product.create({
      data: {
        article: "OP-540",
        name: "Масло моторное 5W-40, 4 л",
        brandId: oilBrand.id,
        categoryId: oils.id,
        price: 14_900,
        quantity: 32,
        description: "Синтетическое моторное масло для бензиновых двигателей.",
        compatibility: "Toyota Camry 2018–2024",
        sortOrder: 3,
      },
    });
    await prisma.product.create({
      data: {
        article: "TL-2418",
        name: "Колодки тормозные передние",
        brandId: brakeBrand.id,
        categoryId: brakes.id,
        price: 8_900,
        quantity: 12,
        description: "Колодки дисковые для передней оси.",
        compatibility: "Toyota Camry 2018–2024",
        sortOrder: 4,
      },
    });
    await prisma.product.createMany({
      data: Array.from({ length: 17 }, (_, index) => ({
        article: `OTHER-${index + 1}`,
        name: `Товар прочий ${index + 1}`,
        brandId: otherBrand.id,
        categoryId: other.id,
        price: 1_000 + index,
        quantity: 1,
        description: "Позиция для проверки добора кандидатов.",
        compatibility: "",
        sortOrder: 10 + index,
      })),
    });

    // Важно: окружение выставляется до первого импорта модуля с PrismaClient.
    process.env.DATABASE_URL = dbUrl;
    delete process.env.DEEPSEEK_API_KEY;

    const { getProducts, searchProducts } = await import("../src/lib/data");
    const { prisma: searchPrisma } = await import("../src/lib/db");
    const { searchProductsSmart } = await import("../src/lib/search");

    try {
      const typo = await searchProducts("масленый фильтр");
      equal(typo.length, 1, "опечатка в окончании: один точный товар");
      equal(typo[0]?.article, "GF-1042", "опечатка в окончании: найден GF-1042");

      const upperCase = await searchProducts("МАСЛЕНЫЙ ФИЛЬТР");
      equal(
        upperCase[0]?.article,
        "GF-1042",
        "регистр не важен: найден GF-1042",
      );

      const article = await searchProducts("gf 1042");
      equal(
        article[0]?.article,
        "GF-1042",
        "артикул без дефиса и в нижнем регистре: найден GF-1042",
      );

      const articleOnly = await searchProducts("TL-2418");
      equal(
        articleOnly.length,
        1,
        "артикул: цифры не сравниваются приблизительно",
      );
      equal(
        articleOnly[0]?.article,
        "TL-2418",
        "артикул: год 2018 не путается с 2418",
      );

      const allFilters = await searchProducts("фильтр");
      equal(allFilters.length, 3, "обычный поиск: три фильтра");
      equal(
        allFilters[0]?.article,
        "GF-1042",
        "обычный поиск: порядок каталога сохранён",
      );

      const allProducts = await getProducts();
      const weakHits = findProductHits(allProducts, "масленный фильтр");
      check(needsAi(weakHits), "две «н»: локальный поиск не уверен");
      equal(
        selectResults(weakHits).length,
        3,
        "две «н»: частичные совпадения остаются запасной выдачей",
      );

      const candidates = topCandidates(weakHits, allProducts);
      equal(candidates.length, 20, "кандидаты для ИИ: не больше двадцати");
      check(
        candidates.some((product) => product.article === "GF-1042"),
        "кандидаты для ИИ: GF-1042 входит в список",
      );

      const allowed = ["GF-1042", "GF-2205"];
      equalJson(
        parseDeepSeekArticles(
          '{"articles":["gf1042","GF-9999","gf-1042","GF-2205"]}',
          allowed,
        ),
        ["GF-1042", "GF-2205"],
        "ответ ИИ: выдуманные и повторные артикулы отброшены",
      );
      equalJson(
        parseDeepSeekArticles(
          '```json\n{"articles":["GF-2205"]}\n```',
          allowed,
        ),
        ["GF-2205"],
        "ответ ИИ: JSON в кодовой обёртке разобран",
      );
      equalJson(
        parseDeepSeekArticles('{"articles":[]}', allowed),
        [],
        "ответ ИИ: пустой список допустим",
      );
      equal(
        parseDeepSeekArticles("не JSON", allowed),
        null,
        "ответ ИИ: невалидный JSON даёт null",
      );

      process.env.DEEPSEEK_API_KEY = "test-key";
      let fetchCalls = 0;
      globalThis.fetch = (async () => {
        fetchCalls += 1;
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: '{"articles":["GF-1042","ВЫДУМАННЫЙ"]}',
                },
              },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }) as typeof fetch;

      equalJson(
        await findMatchingArticles("масленный фильтр", candidates.slice(0, 2)),
        ["GF-1042"],
        "клиент ИИ: ответ профильтрован по белому списку",
      );
      equal(fetchCalls, 1, "клиент ИИ: запрос отправлен один раз");

      globalThis.fetch = (async () => {
        fetchCalls += 1;
        throw new Error("DeepSeek недоступен");
      }) as typeof fetch;

      equal(
        await findMatchingArticles("масленный фильтр", candidates.slice(0, 2)),
        null,
        "клиент ИИ: ошибка сети даёт null",
      );
      equal(fetchCalls, 2, "клиент ИИ: при ошибке запрос был выполнен");

      delete process.env.DEEPSEEK_API_KEY;
      globalThis.fetch = (async () => {
        fetchCalls += 1;
        throw new Error("Без ключа запрос не должен выполняться");
      }) as typeof fetch;

      equal(
        await findMatchingArticles("масленный фильтр", candidates.slice(0, 2)),
        null,
        "клиент ИИ: без ключа возвращается null",
      );
      equal(fetchCalls, 2, "клиент ИИ: без ключа сеть не вызывается");

      // Оркестрация: сильный локальный результат не должен тратить ИИ-запрос.
      process.env.DEEPSEEK_API_KEY = "test-key";
      let smartFetchCalls = 0;
      const successfulFetch = (async () => {
        smartFetchCalls += 1;
        return new Response(
          JSON.stringify({
            choices: [
              { message: { content: '{"articles":["GF-1042"]}' } },
            ],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }) as typeof fetch;

      globalThis.fetch = successfulFetch;
      const strong = await searchProductsSmart("масленый фильтр", "ai-strong");
      equal(strong.usedAi, false, "оркестрация: сильный результат без ИИ");
      equal(
        strong.products[0]?.article,
        "GF-1042",
        "оркестрация: локальный GF-1042",
      );
      equal(
        smartFetchCalls,
        0,
        "оркестрация: сильный результат не зовёт сеть",
      );

      const ai = await searchProductsSmart("масленный фильтр", "ai-success");
      equal(ai.usedAi, true, "оркестрация: слабый запрос исправлен ИИ");
      equalJson(
        ai.products.map((product) => product.article),
        ["GF-1042"],
        "оркестрация: ответ ИИ заменяет частичную выдачу",
      );
      equal(smartFetchCalls, 1, "оркестрация: один запрос к DeepSeek");

      globalThis.fetch = (async () => {
        smartFetchCalls += 1;
        throw new Error("DeepSeek недоступен");
      }) as typeof fetch;
      const failed = await searchProductsSmart("масленный фильтр", "ai-fail");
      equal(failed.usedAi, false, "оркестрация: ошибка ИИ не ломает поиск");
      equal(
        failed.products.length,
        3,
        "оркестрация: при ошибке ИИ видна обычная выдача",
      );
      check(
        failed.products.some((product) => product.article === "GF-1042"),
        "оркестрация: в обычной выдаче есть GF-1042",
      );

      delete process.env.DEEPSEEK_API_KEY;
      globalThis.fetch = (async () => {
        smartFetchCalls += 1;
        throw new Error("Без ключа запрос не должен выполняться");
      }) as typeof fetch;
      const noKeySmart = await searchProductsSmart(
        "масленный фильтр",
        "ai-no-key",
      );
      equal(noKeySmart.usedAi, false, "оркестрация: без ключа ИИ не используется");
      equal(
        smartFetchCalls,
        2,
        "оркестрация: без ключа сеть не вызывается",
      );

      // Лимит: десять ИИ-запросов с одного адреса, одиннадцатый — без ИИ.
      process.env.DEEPSEEK_API_KEY = "test-key";
      globalThis.fetch = successfulFetch;
      const beforeLimit = smartFetchCalls;
      let aiAnswers = 0;

      for (let attempt = 0; attempt < 10; attempt += 1) {
        const result = await searchProductsSmart(
          "масленный фильтр",
          "ai-limit",
        );
        if (result.usedAi) aiAnswers += 1;
      }

      const limited = await searchProductsSmart("масленный фильтр", "ai-limit");
      equal(aiAnswers, 10, "лимит: десять ИИ-запросов разрешены");
      equal(limited.usedAi, false, "лимит: одиннадцатый запрос без ИИ");
      equal(
        smartFetchCalls - beforeLimit,
        10,
        "лимит: сеть вызвана только десять раз",
      );

      console.log(`\nВсе проверки пройдены: ${checks}.`);
    } finally {
      await searchPrisma.$disconnect();
    }
  } finally {
    globalThis.fetch = originalFetch;
    if (originalDeepSeekKey === undefined) {
      delete process.env.DEEPSEEK_API_KEY;
    } else {
      process.env.DEEPSEEK_API_KEY = originalDeepSeekKey;
    }
    await prisma.$disconnect();
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
