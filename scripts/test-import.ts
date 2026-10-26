import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { performance } from "node:perf_hooks";
import * as XLSX from "xlsx";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  applyImportBatch,
  ensureImportEntities,
  resetMissingStock,
} from "../src/lib/import/apply";
import { normalizeArticle } from "../src/lib/import/clean";
import { autoMapColumns } from "../src/lib/import/columns";
import { inspectSheet } from "../src/lib/import/inspect";
import { parseImportFile } from "../src/lib/import/parse";
import { planImport } from "../src/lib/import/plan";
import {
  buildCatalogSnapshot,
  loadCatalogSnapshot,
  type CatalogSnapshot,
} from "../src/lib/import/snapshot";
import type {
  ImportSettings,
  ParsedImportFile,
  SheetData,
} from "../src/lib/import/types";

const samplesDir = path.join(process.cwd(), "docs", "sample-imports");
const KZT: ImportSettings = { currency: "KZT", rate: 1, markup: 0 };
const USD: ImportSettings = { currency: "USD", rate: 500, markup: 10 };
const CNY: ImportSettings = { currency: "CNY", rate: 70, markup: 0 };

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

function sheetByName(parsed: ParsedImportFile, name: string): SheetData {
  const sheet = parsed.sheets.find((item) => item.name === name);
  if (!sheet) throw new Error(`Нет листа ${name}`);
  return sheet;
}

async function loadAndPlan(
  prisma: PrismaClient,
  fileName: string,
  sheetName: string | null,
  settings: ImportSettings,
  snapshot?: CatalogSnapshot,
) {
  const filePath = path.join(samplesDir, fileName);
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Нет файла ${fileName}. Сначала выполните npm run generate:samples`,
    );
  }

  const buffer = fs.readFileSync(filePath);
  const parsed = parseImportFile(buffer, fileName);
  const sheet = sheetName ?? parsed.sheets[0]?.name ?? "";
  const inspection = inspectSheet(parsed, sheet);
  const currentSnapshot = snapshot ?? (await loadCatalogSnapshot(prisma));

  const plan = planImport({
    rows: sheetByName(parsed, inspection.sheet).rows,
    headerIndex: inspection.headerRow - 1,
    mapping: inspection.mapping,
    settings,
    snapshot: currentSnapshot,
  });

  return { parsed, inspection, plan, snapshot: currentSnapshot };
}

async function applyPlan(
  prisma: PrismaClient,
  snapshot: CatalogSnapshot,
  plan: ReturnType<typeof planImport>,
  chunkSize = 2,
) {
  const caches = await ensureImportEntities(prisma, plan, snapshot);

  for (let offset = 0; offset < plan.prepared.length; offset += chunkSize) {
    await applyImportBatch(
      prisma,
      plan.prepared.slice(offset, offset + chunkSize),
      caches,
    );
  }
}

function printPlanSummary(
  title: string,
  parsed: ParsedImportFile,
  inspection: ReturnType<typeof inspectSheet>,
  plan: ReturnType<typeof planImport>,
) {
  const mapping = Object.fromEntries(
    Object.entries(inspection.mapping).filter(([, value]) => value !== null),
  );

  console.log(`\n=== ${title} ===`);
  console.log(
    `Листы: ${parsed.sheets.map((sheet) => sheet.name).join(", ")}` +
      (parsed.encoding ? ` · кодировка: ${parsed.encoding}` : "") +
      (parsed.delimiter ? ` · разделитель: ${parsed.delimiter}` : ""),
  );
  console.log(
    `Заголовки: строка ${inspection.headerRow}, распознано полей: ${Object.keys(mapping).length}`,
  );
  console.log(`Поля: ${JSON.stringify(mapping)}`);
  console.log(
    `Строк: ${plan.totalRows} · добавится: ${plan.createCount} · обновится: ${plan.updateCount} · ошибок: ${plan.errorCount} · дубликатов: ${plan.duplicateExtra}`,
  );

  if (plan.errors.length > 0) {
    console.log(
      `Ошибки: ${plan.errors
        .map((issue) => `стр. ${issue.rowNumber} — ${issue.reason}`)
        .join("; ")}`,
    );
  }
  if (plan.duplicates.length > 0) {
    console.log(
      `Дубликаты: ${plan.duplicates
        .map((item) => `${item.article} (строки ${item.rows.join(", ")})`)
        .join("; ")}`,
    );
  }
}

async function main() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "partshub-import-"));
  const dbUrl = `file:${path.join(tempDir, "test.db")}`;

  console.log("Готовлю временную базу SQLite…");
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    env: { ...process.env, DATABASE_URL: dbUrl },
    stdio: "pipe",
  });

  const prisma = new PrismaClient({
    adapter: new PrismaBetterSqlite3({ url: dbUrl }),
  });

  try {
    const seededCategory = await prisma.category.create({
      data: {
        slug: "existing",
        name: "Существующая",
        shortName: "Существующая",
        description: "",
        icon: "gear",
        sortOrder: 0,
      },
    });
    const seededBrand = await prisma.brand.create({
      data: { name: "Существующий бренд" },
    });
    await prisma.product.create({
      data: {
        article: "ABC 123",
        name: "Старое название",
        price: 1_000,
        quantity: 9,
        unit: "шт.",
        description: "",
        compatibility: "",
        brandId: seededBrand.id,
        categoryId: seededCategory.id,
      },
    });

    // 1. Чистый русский XLSX.
    const clean = await loadAndPlan(
      prisma,
      "clean-russian.xlsx",
      null,
      KZT,
    );
    printPlanSummary(
      "clean-russian.xlsx",
      clean.parsed,
      clean.inspection,
      clean.plan,
    );

    equal(clean.parsed.sheets.length, 1, "чистый файл: один лист");
    equal(clean.inspection.headerRow, 1, "чистый файл: заголовки в строке 1");
    equal(clean.plan.totalRows, 8, "чистый файл: 8 строк данных");
    equal(clean.plan.createCount, 8, "чистый файл: 8 новых товаров");
    equal(clean.plan.updateCount, 0, "чистый файл: нет обновлений");
    equal(clean.plan.errorCount, 0, "чистый файл: нет ошибок");
    equal(clean.plan.duplicateExtra, 0, "чистый файл: нет дубликатов");

    await applyPlan(prisma, clean.snapshot, clean.plan);

    const brakePad = await prisma.product.findUnique({
      where: { article: "ТЛ-1001" },
      include: { brand: true, category: true },
    });
    check(brakePad, "чистый файл: товар ТЛ-1001 создан");
    equal(brakePad.price, 12_500, "чистый файл: цена 12 500 ₸");
    equal(brakePad.quantity, 5, "чистый файл: остаток 5");
    equal(brakePad.brand.name, "ТехноЛайн", "чистый файл: бренд");
    equal(brakePad.category.name, "Тормозная система", "чистый файл: категория");

    const belt = await prisma.product.findUnique({
      where: { article: "Д-4001" },
    });
    equal(belt?.quantity, 11, "чистый файл: «>10» → 11");
    const battery = await prisma.product.findUnique({
      where: { article: "Э-5001" },
    });
    equal(battery?.quantity, 1, "чистый файл: «есть» → 1");
    const shock = await prisma.product.findUnique({
      where: { article: "П-6001" },
    });
    equal(shock?.quantity, 0, "чистый файл: «нет» → 0");
    const invisibleArticle = await prisma.product.findUnique({
      where: { article: "Ф-2001" },
    });
    check(
      invisibleArticle,
      "чистый файл: невидимый символ в артикуле убран",
    );

    // Транслит и запасные бренд/категория — без отдельного файла.
    const translitMapping = autoMapColumns([
      "Artikul",
      "Naimenovanie",
      "Cena",
      "Ostatok",
      "Brend",
      "Kategoriya",
      "Sovmestimost",
      "Ed. izm.",
    ]);
    equal(
      Object.values(translitMapping).filter((value) => value !== null).length,
      8,
      "транслит: распознаны все 8 полей",
    );

    const fallbackPlan = planImport({
      rows: [
        ["Артикул", "Название", "Цена"],
        ["FB-1", "Товар без бренда", "100"],
      ],
      headerIndex: 0,
      mapping: {
        article: 0,
        name: 1,
        price: 2,
        quantity: null,
        brand: null,
        category: null,
        compatibility: null,
        unit: null,
      },
      settings: KZT,
      snapshot: buildCatalogSnapshot([], [], []),
    });
    equal(fallbackPlan.createCount, 1, "запасные значения: товар создаётся");
    check(
      fallbackPlan.newBrands.includes("Без бренда") &&
        fallbackPlan.newCategories.includes("Без категории"),
      "запасные значения: «Без бренда» и «Без категории»",
    );

    // Старый формат .xls читается через тот же парсер.
    const legacyWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(
      legacyWorkbook,
      XLSX.utils.aoa_to_sheet([
        ["Артикул", "Наименование", "Цена", "Остаток"],
        ["XLS-1", "Старый файл Excel", "1 000", "2"],
      ]),
      "Лист1",
    );
    const legacyBuffer = XLSX.write(legacyWorkbook, {
      type: "buffer",
      bookType: "biff8",
    }) as Buffer;
    const legacyParsed = parseImportFile(Buffer.from(legacyBuffer), "legacy.xls");
    const legacyInspection = inspectSheet(
      legacyParsed,
      legacyParsed.sheets[0].name,
    );
    equal(
      legacyInspection.rawHeaders[0],
      "Артикул",
      "формат .xls: заголовки прочитаны",
    );
    equal(
      legacyParsed.sheets[0].rows[1]?.[0],
      "XLS-1",
      "формат .xls: данные прочитаны",
    );

    // 2. Английские заголовки, шапка компании и два листа.
    const english = await loadAndPlan(
      prisma,
      "english-company-header.xlsx",
      "Price list 2026",
      USD,
    );
    printPlanSummary(
      "english-company-header.xlsx",
      english.parsed,
      english.inspection,
      english.plan,
    );

    equal(english.parsed.sheets.length, 2, "английский файл: два листа");
    equal(
      english.inspection.headerRow,
      4,
      "английский файл: заголовки в строке 4 (после шапки компании)",
    );
    equal(english.plan.totalRows, 6, "английский файл: 6 строк");
    equal(english.plan.createCount, 6, "английский файл: 6 новых");
    equal(english.plan.errorCount, 0, "английский файл: нет ошибок");

    await applyPlan(prisma, english.snapshot, english.plan);

    const oilFilter = await prisma.product.findUnique({
      where: { article: "ACM-001" },
    });
    equal(
      oilFilter?.price,
      14_025,
      "английский файл: $25.50 × 500 × 1.1 = 14 025 ₸",
    );
    const timingKit = await prisma.product.findUnique({
      where: { article: "ACM-005" },
    });
    equal(timingKit?.quantity, 6, "английский файл: «>5» → 6");
    const cabin = await prisma.product.findUnique({
      where: { article: "ACM-006" },
    });
    equal(cabin?.quantity, 0, "английский файл: «out of stock» → 0");

    const archive = inspectSheet(english.parsed, "Archive");
    equal(archive.headerRow, 1, "лист Archive: заголовки в строке 1");
    check(
      archive.mapping.article === 0 && archive.mapping.price === 2,
      "лист Archive: колонки распознаны",
    );

    // 3. Китайские заголовки.
    const chinese = await loadAndPlan(
      prisma,
      "chinese-headers.xlsx",
      null,
      CNY,
    );
    printPlanSummary(
      "chinese-headers.xlsx",
      chinese.parsed,
      chinese.inspection,
      chinese.plan,
    );

    equal(chinese.inspection.headerRow, 1, "китайский файл: заголовки в строке 1");
    equal(chinese.plan.totalRows, 5, "китайский файл: 5 строк");
    equal(chinese.plan.createCount, 5, "китайский файл: 5 новых");
    equal(chinese.plan.errorCount, 0, "китайский файл: нет ошибок");
    for (const field of [
      "article",
      "name",
      "price",
      "quantity",
      "brand",
      "category",
      "compatibility",
      "unit",
    ] as const) {
      check(
        chinese.inspection.mapping[field] !== null,
        `китайский файл: поле ${field} распознано`,
      );
    }

    await applyPlan(prisma, chinese.snapshot, chinese.plan);

    const cnFilter = await prisma.product.findUnique({
      where: { article: "CN-1001" },
    });
    equal(cnFilter?.price, 1_750, "китайский файл: ¥25 × 70 = 1 750 ₸");
    equal(cnFilter?.quantity, 100, "китайский файл: остаток 100");
    equal(cnFilter?.unit, "个", "китайский файл: единица «个»");
    const cnBrake = await prisma.product.findUnique({
      where: { article: "CN-1003" },
    });
    equal(cnBrake?.quantity, 11, "китайский файл: «>10» → 11");
    const cnShock = await prisma.product.findUnique({
      where: { article: "CN-1004" },
    });
    equal(cnShock?.quantity, 1, "китайский файл: «有货» → 1");
    const cnBelt = await prisma.product.findUnique({
      where: { article: "CN-1005" },
    });
    equal(cnBelt?.quantity, 0, "китайский файл: «无货» → 0");

    // 4. Грязный CSV в Windows-1251.
    const dirty = await loadAndPlan(
      prisma,
      "dirty-windows1251.csv",
      null,
      KZT,
    );
    printPlanSummary(
      "dirty-windows1251.csv",
      dirty.parsed,
      dirty.inspection,
      dirty.plan,
    );

    equal(
      dirty.parsed.encoding,
      "Windows-1251",
      "грязный CSV: определена кодировка Windows-1251",
    );
    equal(
      dirty.parsed.delimiter,
      "точка с запятой",
      "грязный CSV: определён разделитель ;",
    );
    equal(dirty.inspection.headerRow, 3, "грязный CSV: заголовки в строке 3");
    equal(dirty.plan.totalRows, 8, "грязный CSV: 8 строк данных");
    equal(dirty.plan.createCount, 5, "грязный CSV: 5 новых");
    equal(dirty.plan.updateCount, 1, "грязный CSV: 1 обновление");
    equal(dirty.plan.errorCount, 1, "грязный CSV: 1 ошибка");
    equal(dirty.plan.duplicateExtra, 1, "грязный CSV: 1 лишний дубликат");
    check(
      dirty.plan.errors[0]?.rowNumber === 8 &&
        dirty.plan.errors[0]?.reason.includes("цену"),
      "грязный CSV: ошибка цены в строке 8",
    );
    check(
      dirty.plan.duplicates[0]?.rows.join(",") === "9,10" &&
        normalizeArticle(dirty.plan.duplicates[0]?.article) === "abc123",
      "грязный CSV: дубликат ABC-123 в строках 9 и 10",
    );
    check(
      dirty.plan.fileArticleKeys.includes("a104"),
      "грязный CSV: артикул строки с ошибкой тоже считается присутствующим",
    );

    await applyPlan(prisma, dirty.snapshot, dirty.plan);

    const dirtyA100 = await prisma.product.findUnique({
      where: { article: "A-100" },
    });
    equal(dirtyA100?.price, 12_500, "грязный CSV: «12 500 тг» → 12 500 ₸");
    equal(dirtyA100?.quantity, 5, "грязный CSV: «5 шт» → 5");
    const dirtyA101 = await prisma.product.findUnique({
      where: { article: "а 101" },
    });
    equal(dirtyA101?.price, 8_990, "грязный CSV: артикул с пробелом создан");
    equal(dirtyA101?.quantity, 11, "грязный CSV: «>10» → 11");
    const dirtyA102 = await prisma.product.findUnique({
      where: { article: "A-102" },
    });
    equal(dirtyA102?.price, 1_235, "грязный CSV: «1 234,50 тг» → 1 235 ₸");
    equal(dirtyA102?.quantity, 1, "грязный CSV: «есть» → 1");
    const dirtyA103 = await prisma.product.findUnique({
      where: { article: "A-103" },
    });
    check(dirtyA103, "грязный CSV: невидимые символы в артикуле убраны");
    equal(dirtyA103.price, 2_500, "грязный CSV: «2.500 тг» → 2 500 ₸");
    equal(dirtyA103.quantity, 0, "грязный CSV: «нет» → 0");

    const updated = await prisma.product.findUnique({
      where: { article: "ABC 123" },
    });
    equal(updated?.name, "Название-дубль последняя", "грязный CSV: дубль обновил название");
    equal(updated?.price, 7_500, "грязный CSV: дубль обновил цену");
    equal(updated?.quantity, 4, "грязный CSV: дубль обновил остаток");

    const quoted = await prisma.product.findUnique({
      where: { article: "A-105" },
    });
    equal(
      quoted?.name,
      "Фильтр масляный; усиленный",
      "грязный CSV: кавычки и ; в названии",
    );
    equal(quoted?.price, 9_100, "грязный CSV: цена A-105");
    equal(quoted?.quantity, 7, "грязный CSV: остаток A-105");

    // Повторное планирование после импорта: всё уже существует.
    const afterImportSnapshot = await loadCatalogSnapshot(prisma);
    const dirtyAgain = await loadAndPlan(
      prisma,
      "dirty-windows1251.csv",
      null,
      KZT,
      afterImportSnapshot,
    );
    equal(dirtyAgain.plan.createCount, 0, "повтор: новых нет");
    equal(dirtyAgain.plan.updateCount, 6, "повтор: все 6 строк — обновления");

    // 5. Обнуление остатков у товаров, которых не было в последнем импорте.
    const keptKeys = new Set(dirty.plan.fileArticleKeys);
    const resetCount = await resetMissingStock(prisma, keptKeys);
    equal(
      resetCount,
      19,
      "обнуление: 25 товаров всего, 6 из последнего импорта",
    );

    const cleanAfterReset = await prisma.product.findUnique({
      where: { article: "ТЛ-1001" },
    });
    equal(cleanAfterReset?.quantity, 0, "обнуление: ТЛ-1001 остаток 0");
    const dirtyAfterReset = await prisma.product.findUnique({
      where: { article: "A-100" },
    });
    equal(dirtyAfterReset?.quantity, 5, "обнуление: товар из последнего файла не тронут");

    // 6. Нагрузка: 50 000 строк CSV.
    const lines = [
      "Артикул,Наименование,Цена,Остаток,Бренд,Категория",
    ];
    for (let index = 0; index < 50_000; index += 1) {
      lines.push(
        `BIG-${index},"Товар ${index}","12 500","5","Бренд","Категория"`,
      );
    }

    const largeBuffer = Buffer.from(`${lines.join("\r\n")}\r\n`, "utf8");
    const started = performance.now();
    const largeParsed = parseImportFile(largeBuffer, "large-50000.csv");
    const largeInspection = inspectSheet(
      largeParsed,
      largeParsed.sheets[0].name,
    );
    const emptySnapshot = await loadCatalogSnapshot(prisma);
    const largePlan = planImport({
      rows: largeParsed.sheets[0].rows,
      headerIndex: largeInspection.headerRow - 1,
      mapping: largeInspection.mapping,
      settings: KZT,
      snapshot: emptySnapshot,
    });
    const elapsed = Math.round(performance.now() - started);

    equal(largePlan.totalRows, 50_000, "50 000 строк: все прочитаны");
    equal(largePlan.prepared.length, 50_000, "50 000 строк: все подготовлены");
    equal(largePlan.errorCount, 0, "50 000 строк: без ошибок");
    console.log(
      `\n=== 50 000 строк ===\nПрочитано и проверено за ${elapsed} мс; к записи: ${largePlan.prepared.length}`,
    );

    console.log(`\nВсе проверки пройдены: ${checks}.`);
  } finally {
    await prisma.$disconnect();
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
