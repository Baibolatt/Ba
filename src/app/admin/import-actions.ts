"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import {
  applyImportBatch,
  ensureImportEntities,
  resetMissingStock,
  type ImportCaches,
} from "@/lib/import/apply";
import { normalizeArticle } from "@/lib/import/clean";
import {
  ImportInputError,
  inspectSheet,
  parseMapping,
  validateSettings,
} from "@/lib/import/inspect";
import {
  createImportJob,
  getImportJob,
  type ImportJob,
} from "@/lib/import/jobs";
import { ImportParseError, parseImportFile } from "@/lib/import/parse";
import { planImport } from "@/lib/import/plan";
import { loadCatalogSnapshot } from "@/lib/import/snapshot";
import type {
  ColumnMapping,
  ImportAnalysisResult,
  ImportChunkResult,
  ImportPlan,
  ImportPreviewResult,
  ImportRunSummary,
  ImportSettings,
  SheetData,
} from "@/lib/import/types";

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const CHUNK_SIZE = 500;
const MAX_ERRORS_IN_RESPONSE = 200;
const MAX_DUPLICATES_IN_RESPONSE = 100;

export type ImportActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export type PreviewInput = {
  jobId: string;
  sheet: string;
  headerRow?: number;
  mapping: ColumnMapping;
  settings: ImportSettings;
};

export type BeginImportResult = {
  total: number;
  createCount: number;
  updateCount: number;
  done: boolean;
};

function failure<T>(error: unknown): ImportActionResult<T> {
  if (error instanceof ImportParseError || error instanceof ImportInputError) {
    return { ok: false, error: error.message };
  }

  console.error("Ошибка импорта прайс-листа:", error);

  return {
    ok: false,
    error:
      error instanceof Error
        ? `Ошибка импорта: ${error.message}`
        : "Не удалось выполнить импорт.",
  };
}

function requireJob(jobId: string): ImportJob {
  const job = getImportJob(jobId);
  if (!job) {
    throw new ImportInputError(
      "Сессия импорта истекла. Загрузите файл заново.",
    );
  }
  return job;
}

function sheetOf(job: ImportJob, sheetName: string): SheetData {
  return (
    job.parsed.sheets.find((sheet) => sheet.name === sheetName) ??
    job.parsed.sheets[0]
  );
}

function toAnalysis(
  job: ImportJob,
  inspection: ReturnType<typeof inspectSheet>,
): ImportAnalysisResult {
  return {
    jobId: job.id,
    fileName: job.fileName,
    sheet: inspection.sheet,
    sheetNames: inspection.sheetNames,
    totalRows: inspection.totalRows,
    headerRow: inspection.headerRow,
    headers: inspection.headers,
    rawHeaders: inspection.rawHeaders,
    mapping: inspection.mapping,
    sampleRows: inspection.sampleRows,
    encoding: job.parsed.encoding,
    delimiter: job.parsed.delimiter,
    warnings: inspection.warnings,
  };
}

async function buildPlan(
  job: ImportJob,
  input: PreviewInput,
): Promise<{ plan: ImportPlan; settings: ImportSettings }> {
  const inspection = inspectSheet(job.parsed, input.sheet, input.headerRow);
  const settings = validateSettings(input.settings);
  const mapping = parseMapping(input.mapping, inspection.headers.length);
  const sheet = sheetOf(job, inspection.sheet);
  const snapshot = await loadCatalogSnapshot(prisma);

  const plan = planImport({
    rows: sheet.rows,
    headerIndex: inspection.headerRow - 1,
    mapping,
    settings,
    snapshot,
  });

  return { plan, settings };
}

function toPreview(plan: ImportPlan, mapping: ColumnMapping): ImportPreviewResult {
  const warnings: string[] = [];

  if (mapping.article === null) {
    warnings.push(
      "Не выбрана колонка артикула — все строки попадут в ошибки.",
    );
  }
  if (mapping.name === null) {
    warnings.push(
      "Не выбрана колонка названия — новые товары без названия не добавятся.",
    );
  }
  if (mapping.price === null) {
    warnings.push(
      "Не выбрана колонка цены — новые товары не добавятся, у существующих цена не изменится.",
    );
  }

  const sample = plan.prepared.slice(0, 20).map((record) => ({
    rowNumber: record.rowNumber,
    article: record.article,
    name: record.name,
    price: record.price,
    quantity:
      record.quantity ??
      (record.existingId === null ? 0 : null),
    unit: record.unit ?? "шт.",
    brand: record.brandName ?? "—",
    category: record.categoryName ?? "—",
    compatibility: record.compatibility ?? "—",
    action: record.existingId === null ? ("add" as const) : ("update" as const),
  }));

  return {
    stats: {
      totalRows: plan.totalRows,
      validRows: plan.prepared.length,
      createCount: plan.createCount,
      updateCount: plan.updateCount,
      errorCount: plan.errorCount,
      duplicateExtra: plan.duplicateExtra,
      newBrands: plan.newBrands.length,
      newCategories: plan.newCategories.length,
    },
    errors: plan.errors.slice(0, MAX_ERRORS_IN_RESPONSE),
    errorsTruncated: plan.errorCount > MAX_ERRORS_IN_RESPONSE,
    duplicates: plan.duplicates.slice(0, MAX_DUPLICATES_IN_RESPONSE),
    duplicatesTruncated:
      plan.duplicates.length > MAX_DUPLICATES_IN_RESPONSE,
    sample,
    newBrands: plan.newBrands,
    newCategories: plan.newCategories,
    warnings,
  };
}

export async function analyzeImportAction(
  formData: FormData,
): Promise<ImportActionResult<ImportAnalysisResult>> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  try {
    const file = formData.get("file");

    if (!(file instanceof File)) {
      throw new ImportInputError("Выберите файл для импорта.");
    }

    if (file.size === 0) {
      throw new ImportInputError("Файл пустой.");
    }

    if (file.size > MAX_FILE_BYTES) {
      throw new ImportInputError(
        "Файл больше 25 МБ. Разделите его на части.",
      );
    }

    const extension = file.name.toLowerCase().split(".").pop() ?? "";
    if (!["xlsx", "xls", "xlsm", "csv", "txt"].includes(extension)) {
      throw new ImportInputError(
        "Поддерживаются файлы .xlsx, .xls и .csv.",
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const parsed = parseImportFile(buffer, file.name);
    const job = createImportJob(file.name, buffer, parsed);
    const inspection = inspectSheet(parsed, parsed.sheets[0]?.name ?? "");

    return { ok: true, data: toAnalysis(job, inspection) };
  } catch (error) {
    return failure(error);
  }
}

export async function readSheetAction(
  jobId: string,
  sheet: string,
  headerRow?: number,
): Promise<ImportActionResult<ImportAnalysisResult>> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  try {
    const job = requireJob(jobId);
    const inspection = inspectSheet(job.parsed, sheet, headerRow);
    return { ok: true, data: toAnalysis(job, inspection) };
  } catch (error) {
    return failure(error);
  }
}

export async function previewImportAction(
  input: PreviewInput,
): Promise<ImportActionResult<ImportPreviewResult>> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  try {
    const job = requireJob(input.jobId);
    const { plan } = await buildPlan(job, input);
    const inspection = inspectSheet(job.parsed, input.sheet, input.headerRow);
    const mapping = parseMapping(input.mapping, inspection.headers.length);

    return { ok: true, data: toPreview(plan, mapping) };
  } catch (error) {
    return failure(error);
  }
}

export async function beginImportAction(
  input: PreviewInput,
): Promise<ImportActionResult<BeginImportResult>> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  try {
    const job = requireJob(input.jobId);
    const { plan } = await buildPlan(job, input);

    if (plan.prepared.length === 0) {
      job.runtime = null;
      return {
        ok: true,
        data: {
          total: 0,
          createCount: 0,
          updateCount: 0,
          done: true,
        },
      };
    }

    const snapshot = await loadCatalogSnapshot(prisma);
    const caches: ImportCaches = await ensureImportEntities(
      prisma,
      plan,
      snapshot,
    );

    const run = await prisma.importRun.create({
      data: {
        fileName: job.fileName,
        totalRows: plan.totalRows,
      },
    });

    job.runtime = {
      records: plan.prepared,
      caches,
      offset: 0,
      added: 0,
      updated: 0,
      runId: run.id,
      articleKeys: [...plan.fileArticleKeys],
    };

    return {
      ok: true,
      data: {
        total: plan.prepared.length,
        createCount: plan.createCount,
        updateCount: plan.updateCount,
        done: false,
      },
    };
  } catch (error) {
    return failure(error);
  }
}

async function finalizeRun(job: ImportJob): Promise<void> {
  const runtime = job.runtime;
  if (!runtime) return;

  await prisma.importRun.update({
    where: { id: runtime.runId },
    data: {
      createdCount: runtime.added,
      updatedCount: runtime.updated,
      articleKeys: JSON.stringify(runtime.articleKeys),
      completed: true,
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin");
  revalidatePath("/admin/import");
}

export async function importChunkAction(
  jobId: string,
): Promise<ImportActionResult<ImportChunkResult>> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  try {
    const job = requireJob(jobId);
    const runtime = job.runtime;

    if (!runtime) {
      throw new ImportInputError(
        "Импорт не запущен. Нажмите «Импортировать» ещё раз.",
      );
    }

    const total = runtime.records.length;

    if (runtime.offset >= total) {
      await finalizeRun(job);

      return {
        ok: true,
        data: {
          processed: runtime.offset,
          total,
          added: runtime.added,
          updated: runtime.updated,
          done: true,
        },
      };
    }

    const batch = runtime.records.slice(
      runtime.offset,
      runtime.offset + CHUNK_SIZE,
    );
    const result = await applyImportBatch(prisma, batch, runtime.caches);

    runtime.offset += batch.length;
    runtime.added += result.added;
    runtime.updated += result.updated;

    const done = runtime.offset >= total;
    if (done) {
      await finalizeRun(job);
    }

    return {
      ok: true,
      data: {
        processed: runtime.offset,
        total,
        added: runtime.added,
        updated: runtime.updated,
        done,
      },
    };
  } catch (error) {
    return failure(error);
  }
}

export async function resetMissingStockAction(): Promise<
  ImportActionResult<{ resetCount: number; run: ImportRunSummary }>
> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  try {
    const run = await prisma.importRun.findFirst({
      where: { completed: true },
      orderBy: { createdAt: "desc" },
    });

    if (!run) {
      throw new ImportInputError(
        "Нет завершённого импорта, с которым можно сравнить товары.",
      );
    }

    let keys: unknown;
    try {
      keys = JSON.parse(run.articleKeys);
    } catch {
      throw new ImportInputError("Не удалось прочитать список артикулов.");
    }

    if (!Array.isArray(keys) || keys.length === 0) {
      throw new ImportInputError(
        "В последнем импорте нет товаров — обнуление отменено.",
      );
    }

    const keptKeys = new Set(keys.map((key) => normalizeArticle(key)));
    const resetCount = await resetMissingStock(prisma, keptKeys);

    revalidatePath("/", "layout");
    revalidatePath("/admin");
    revalidatePath("/admin/import");

    return {
      ok: true,
      data: {
        resetCount,
        run: {
          fileName: run.fileName,
          createdAt: run.createdAt.toISOString(),
          createdCount: run.createdCount,
          updatedCount: run.updatedCount,
        },
      },
    };
  } catch (error) {
    return failure(error);
  }
}
