"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import {
  beginImportAction,
  importChunkAction,
  previewImportAction,
  readSheetAction,
  resetMissingStockAction,
  analyzeImportAction,
} from "@/app/admin/import-actions";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/form-fields";
import { normalizeHeader } from "@/lib/import/columns";
import {
  DEFAULT_IMPORT_SETTINGS,
  IMPORT_CURRENCIES,
  IMPORT_FIELD_HINTS,
  IMPORT_FIELD_LABELS,
  IMPORT_FIELDS,
  type ColumnMapping,
  type ImportAnalysisResult,
  type ImportCurrency,
  type ImportField,
  type ImportPreviewResult,
  type ImportRunSummary,
  type ImportSettings,
} from "@/lib/import/types";
import { formatPrice } from "@/lib/format";
import { cn } from "@/lib/cn";

const SETTINGS_STORAGE_KEY = "partshub.import.settings";
const MAPPING_STORAGE_PREFIX = "partshub.import.mapping.";

type Step = "upload" | "mapping" | "preview" | "importing" | "done";

type ProgressState = {
  processed: number;
  total: number;
  added: number;
  updated: number;
};

type ImportResult = {
  added: number;
  updated: number;
  total: number;
};

type ImportWizardProps = {
  latestRun: ImportRunSummary | null;
};

function mappingStorageKey(rawHeaders: string[]): string {
  return (
    MAPPING_STORAGE_PREFIX +
    rawHeaders.map((header) => normalizeHeader(header)).join("|")
  );
}

function loadSavedMapping(
  rawHeaders: string[],
  columnCount: number,
): ColumnMapping | null {
  try {
    const raw = window.localStorage.getItem(mappingStorageKey(rawHeaders));
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const mapping = {} as ColumnMapping;
    let mapped = 0;

    for (const field of IMPORT_FIELDS) {
      const value = parsed[field];
      if (value === null || value === undefined) {
        mapping[field] = null;
        continue;
      }
      const column = Number(value);
      if (
        !Number.isInteger(column) ||
        column < 0 ||
        column >= columnCount
      ) {
        return null;
      }
      mapping[field] = column;
      mapped += 1;
    }

    return mapped > 0 ? mapping : null;
  } catch {
    return null;
  }
}

function saveMapping(rawHeaders: string[], mapping: ColumnMapping) {
  try {
    window.localStorage.setItem(
      mappingStorageKey(rawHeaders),
      JSON.stringify(mapping),
    );
  } catch {
    // Хранилище может быть недоступно — не мешаем импорту.
  }
}

function loadSavedSettings(): ImportSettings | null {
  try {
    const raw = window.localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<ImportSettings>;
    const currency = parsed.currency;
    if (currency !== "KZT" && currency !== "USD" && currency !== "CNY") {
      return null;
    }
    const rate = Number(parsed.rate);
    const markup = Number(parsed.markup);

    return {
      currency,
      rate:
        currency === "KZT"
          ? 1
          : Number.isFinite(rate) && rate > 0
            ? rate
            : DEFAULT_IMPORT_SETTINGS.rate,
      markup: Number.isFinite(markup) ? markup : 0,
    };
  } catch {
    return null;
  }
}

function saveSettings(settings: ImportSettings) {
  try {
    window.localStorage.setItem(
      SETTINGS_STORAGE_KEY,
      JSON.stringify(settings),
    );
  } catch {
    // Ничего страшного: настройки просто не запомнятся.
  }
}

function formatRunDate(value: string): string {
  try {
    return new Intl.DateTimeFormat("ru-RU", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

const actionLabels = { add: "Добавить", update: "Обновить" } as const;

export function ImportWizard({ latestRun: initialRun }: ImportWizardProps) {
  const [step, setStep] = useState<Step>("upload");
  const [file, setFile] = useState<File | null>(null);
  const [analysis, setAnalysis] = useState<ImportAnalysisResult | null>(null);
  const [mapping, setMapping] = useState<ColumnMapping | null>(null);
  const [settings, setSettings] = useState<ImportSettings>(
    DEFAULT_IMPORT_SETTINGS,
  );
  const [preview, setPreview] = useState<ImportPreviewResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [savedMappingUsed, setSavedMappingUsed] = useState(false);
  const [headerInput, setHeaderInput] = useState("1");
  const [progress, setProgress] = useState<ProgressState>({
    processed: 0,
    total: 0,
    added: 0,
    updated: 0,
  });
  const [result, setResult] = useState<ImportResult | null>(null);
  const [latestRun, setLatestRun] = useState<ImportRunSummary | null>(
    initialRun,
  );
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = loadSavedSettings();
    if (!saved) return;

    // Переносим настройки из localStorage после гидратации, без SSR-расхождений.
    const timer = window.setTimeout(() => setSettings(saved), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const currencyInfo = useMemo(
    () =>
      IMPORT_CURRENCIES.find((item) => item.value === settings.currency) ??
      IMPORT_CURRENCIES[0],
    [settings.currency],
  );

  const mappedRequired = useMemo(() => {
    if (!mapping) return [] as ImportField[];
    return (["article", "name", "price"] as ImportField[]).filter(
      (field) => mapping[field] === null,
    );
  }, [mapping]);

  function applyAnalysis(next: ImportAnalysisResult) {
    setAnalysis(next);
    setHeaderInput(String(next.headerRow));
    setPreview(null);
    setError(null);

    const saved = loadSavedMapping(next.rawHeaders, next.headers.length);
    if (saved) {
      setMapping(saved);
      setSavedMappingUsed(true);
      setNotice("Применено сохранённое сопоставление для этих колонок.");
    } else {
      setMapping(next.mapping);
      setSavedMappingUsed(false);
      setNotice(null);
    }

    setStep("mapping");
  }

  async function handleAnalyze(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError("Выберите файл .xlsx, .xls или .csv.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await analyzeImportAction(formData);

      if (!response.ok) {
        setError(response.error);
        return;
      }

      applyAnalysis(response.data);
    } finally {
      setBusy(false);
    }
  }

  async function handleSheetChange(sheet: string) {
    if (!analysis) return;
    setBusy(true);
    setError(null);

    try {
      const response = await readSheetAction(analysis.jobId, sheet);
      if (!response.ok) {
        setError(response.error);
        return;
      }
      applyAnalysis(response.data);
    } finally {
      setBusy(false);
    }
  }

  async function handleHeaderApply() {
    if (!analysis) return;
    const headerRow = Number(headerInput);

    if (!Number.isInteger(headerRow) || headerRow < 1) {
      setError("Номер строки заголовков должен быть целым числом от 1.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const response = await readSheetAction(
        analysis.jobId,
        analysis.sheet,
        headerRow,
      );
      if (!response.ok) {
        setError(response.error);
        return;
      }
      applyAnalysis(response.data);
    } finally {
      setBusy(false);
    }
  }

  function updateMapping(field: ImportField, value: string) {
    if (!mapping) return;
    setMapping({
      ...mapping,
      [field]: value === "" ? null : Number(value),
    });
  }

  function handleCurrencyChange(currency: ImportCurrency) {
    const info =
      IMPORT_CURRENCIES.find((item) => item.value === currency) ??
      IMPORT_CURRENCIES[0];
    setSettings({
      ...settings,
      currency,
      rate: info.rate,
    });
  }

  function previewInput() {
    if (!analysis || !mapping) return null;

    saveMapping(analysis.rawHeaders, mapping);
    saveSettings(settings);

    return {
      jobId: analysis.jobId,
      sheet: analysis.sheet,
      headerRow: analysis.headerRow,
      mapping,
      settings,
    };
  }

  async function handlePreview() {
    const input = previewInput();
    if (!input) return;

    setBusy(true);
    setError(null);

    try {
      const response = await previewImportAction(input);
      if (!response.ok) {
        setError(response.error);
        return;
      }
      setPreview(response.data);
      setStep("preview");
    } finally {
      setBusy(false);
    }
  }

  async function handleImport() {
    const input = previewInput();
    if (!input || !analysis) return;

    setBusy(true);
    setError(null);
    setStep("importing");
    setProgress({ processed: 0, total: 0, added: 0, updated: 0 });

    try {
      const begin = await beginImportAction(input);
      if (!begin.ok) {
        setError(begin.error);
        setStep("preview");
        return;
      }

      if (begin.data.done) {
        setResult({ added: 0, updated: 0, total: 0 });
        setStep("done");
        return;
      }

      setProgress({
        processed: 0,
        total: begin.data.total,
        added: 0,
        updated: 0,
      });

      let added = 0;
      let updated = 0;
      let processed = 0;

      for (;;) {
        const chunk = await importChunkAction(analysis.jobId);

        if (!chunk.ok) {
          setError(chunk.error);
          setStep("preview");
          setProgress((current) => ({ ...current, processed }));
          return;
        }

        processed = chunk.data.processed;
        added = chunk.data.added;
        updated = chunk.data.updated;
        setProgress({
          processed,
          total: chunk.data.total,
          added,
          updated,
        });

        if (chunk.data.done) break;
      }

      setResult({ added, updated, total: processed });
      setLatestRun({
        fileName: analysis.fileName,
        createdAt: new Date().toISOString(),
        createdCount: added,
        updatedCount: updated,
      });
      setResetMessage(null);
      setStep("done");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Не удалось выполнить импорт.",
      );
      setStep("preview");
    } finally {
      setBusy(false);
    }
  }

  async function handleResetMissing() {
    if (!latestRun) return;

    const confirmed = window.confirm(
      `Обнулить остаток у всех товаров, которых не было в файле «${latestRun.fileName}»?\n\nДействие меняет остатки, но не удаляет товары.`,
    );
    if (!confirmed) return;

    setBusy(true);
    setResetMessage(null);
    setError(null);

    try {
      const response = await resetMissingStockAction();
      if (!response.ok) {
        setError(response.error);
        return;
      }

      setLatestRun(response.data.run);
      setResetMessage(
        response.data.resetCount === 0
          ? "Все товары из базы были в последнем импорте — обнулять нечего."
          : `Остаток обнулён у ${response.data.resetCount.toLocaleString("ru-RU")} товаров.`,
      );
    } finally {
      setBusy(false);
    }
  }

  function resetWizard() {
    setStep("upload");
    setFile(null);
    setAnalysis(null);
    setMapping(null);
    setPreview(null);
    setBusy(false);
    setError(null);
    setNotice(null);
    setSavedMappingUsed(false);
    setProgress({ processed: 0, total: 0, added: 0, updated: 0 });
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const progressPercent =
    progress.total > 0
      ? Math.min(100, Math.round((progress.processed / progress.total) * 100))
      : 0;

  return (
    <div className="space-y-5">
      {error ? (
        <p
          role="alert"
          className="rounded-control border border-danger/30 bg-danger-soft px-3 py-2 text-sm font-medium text-danger"
        >
          {error}
        </p>
      ) : null}

      {step === "upload" ? (
        <section className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
          <h2 className="text-lg font-bold tracking-tight text-ink">
            Загрузить прайс-лист
          </h2>
          <p className="mt-1 text-sm text-muted">
            Подойдёт .xlsx, .xls или .csv без подготовки. Шапка компании,
            пустые строки и разные названия колонок не мешают.
          </p>

          <form onSubmit={handleAnalyze} className="mt-4 space-y-4">
            <label className="block space-y-1.5">
              <span className="block text-sm font-medium text-ink">
                Файл
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.xlsm,.csv,.txt"
                onChange={(event) =>
                  setFile(event.target.files?.[0] ?? null)
                }
                className={cn(
                  fieldControlClass(false),
                  "h-auto py-2 text-sm file:mr-3 file:rounded-control file:border-0 file:bg-brand file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white",
                )}
              />
              <span className="block text-xs text-muted">
                До 25 МБ и 100 000 строк. Кодировка CSV определяется
                автоматически.
              </span>
            </label>

            <PriceSettings
              settings={settings}
              currencyInfo={currencyInfo}
              onChange={setSettings}
              onCurrencyChange={handleCurrencyChange}
            />

            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" size="md" disabled={busy || !file}>
                {busy ? "Разбираем файл…" : "Разобрать файл"}
              </Button>
              <span className="text-xs text-muted">
                Следующий шаг — проверка колонок и предпросмотр. В базу ничего
                не пишется.
              </span>
            </div>
          </form>
        </section>
      ) : null}

      {step === "mapping" && analysis && mapping ? (
        <>
          <section className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-ink">
                  Колонки и заголовки
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {analysis.fileName} ·{" "}
                  {analysis.totalRows.toLocaleString("ru-RU")} строк данных
                  {analysis.encoding ? ` · ${analysis.encoding}` : ""}
                  {analysis.delimiter ? ` · ${analysis.delimiter}` : ""}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={resetWizard}
              >
                Другой файл
              </Button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {analysis.sheetNames.length > 1 ? (
                <label className="space-y-1.5">
                  <span className="block text-sm font-medium text-ink">
                    Лист
                  </span>
                  <select
                    value={analysis.sheet}
                    onChange={(event) =>
                      void handleSheetChange(event.target.value)
                    }
                    disabled={busy}
                    className={cn(fieldControlClass(false), "h-11")}
                  >
                    {analysis.sheetNames.map((sheet) => (
                      <option key={sheet} value={sheet}>
                        {sheet}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <label className="space-y-1.5">
                <span className="block text-sm font-medium text-ink">
                  Строка заголовков
                </span>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min={1}
                    value={headerInput}
                    onChange={(event) => setHeaderInput(event.target.value)}
                    className={cn(fieldControlClass(false), "h-11 w-24")}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => void handleHeaderApply()}
                    disabled={busy}
                  >
                    Применить
                  </Button>
                </div>
                <span className="block text-xs text-muted">
                  Найдена автоматически; можно поправить.
                </span>
              </label>
            </div>

            {analysis.warnings.length > 0 ? (
              <ul className="mt-3 space-y-1 rounded-control bg-tint px-3 py-2 text-xs text-muted">
                {analysis.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : null}

            {notice ? (
              <p className="mt-3 rounded-control bg-success-soft px-3 py-2 text-xs font-medium text-success">
                {notice}
              </p>
            ) : null}

            {savedMappingUsed ? (
              <p className="mt-2 text-xs text-muted">
                Правки сопоставления запомнятся для файлов с такими же
                заголовками.
              </p>
            ) : null}
          </section>

          <section className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
            <div className="flex items-end justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-ink">
                  Сопоставление колонок
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Проверьте, что автоматика поняла правильно. Поля без колонки
                  можно не заполнять.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setMapping(analysis.mapping);
                  setSavedMappingUsed(false);
                  setNotice(null);
                }}
                disabled={busy}
              >
                Сбросить к авто
              </Button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {IMPORT_FIELDS.map((field) => {
                const isRequired =
                  field === "article" || field === "name" || field === "price";
                return (
                  <label key={field} className="block space-y-1.5">
                    <span className="block text-sm font-medium text-ink">
                      {IMPORT_FIELD_LABELS[field]}
                      {isRequired ? (
                        <span className="ml-0.5 text-danger">*</span>
                      ) : null}
                    </span>
                    <select
                      value={mapping[field] ?? ""}
                      onChange={(event) =>
                        updateMapping(field, event.target.value)
                      }
                      className={cn(fieldControlClass(false), "h-11")}
                    >
                      <option value="">— не использовать —</option>
                      {analysis.headers.map((header, index) => (
                        <option key={`${field}-${index}`} value={index}>
                          {header}
                        </option>
                      ))}
                    </select>
                    <span className="block text-xs text-muted">
                      {IMPORT_FIELD_HINTS[field]}
                    </span>
                  </label>
                );
              })}
            </div>

            {mappedRequired.length > 0 ? (
              <p className="mt-3 rounded-control bg-danger-soft px-3 py-2 text-xs font-medium text-danger">
                Без артикула, названия или цены часть строк не импортируется —
                подробнее на предпросмотре.
              </p>
            ) : null}
          </section>

          <section className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
            <div className="border-b border-line p-4 sm:p-5">
              <h2 className="text-lg font-bold tracking-tight text-ink">
                Как выглядит файл
              </h2>
              <p className="mt-1 text-sm text-muted">
                Первые строки после заголовков, как их прочитала программа.
              </p>
            </div>
            <div className="max-h-72 overflow-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-xs">
                <thead className="sticky top-0 bg-page">
                  <tr>
                    <th className="border-b border-line px-2 py-2 font-semibold text-muted">
                      #
                    </th>
                    {analysis.headers.map((header) => (
                      <th
                        key={header}
                        className="whitespace-nowrap border-b border-line px-2 py-2 font-semibold text-muted"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analysis.sampleRows.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      <td className="border-b border-line px-2 py-1.5 text-muted">
                        {rowIndex + 1}
                      </td>
                      {row.map((cell, cellIndex) => (
                        <td
                          key={cellIndex}
                          className="max-w-48 truncate border-b border-line px-2 py-1.5 text-ink"
                          title={cell}
                        >
                          {cell || "—"}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <PriceSettings
            settings={settings}
            currencyInfo={currencyInfo}
            onChange={setSettings}
            onCurrencyChange={handleCurrencyChange}
          />

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="md"
              onClick={() => void handlePreview()}
              disabled={busy}
            >
              {busy ? "Считаем…" : "Показать предпросмотр"}
            </Button>
            <span className="text-xs text-muted">
              Ничего не запишется, пока вы не нажмёте «Импортировать».
            </span>
          </div>
        </>
      ) : null}

      {step === "preview" && preview ? (
        <>
          <section className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="text-lg font-bold tracking-tight text-ink">
                  Предпросмотр импорта
                </h2>
                <p className="mt-1 text-sm text-muted">
                  {analysis?.fileName}
                  {analysis?.sheet ? ` · лист «${analysis.sheet}»` : ""}
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setStep("mapping")}
                disabled={busy}
              >
                Назад к колонкам
              </Button>
            </div>

            <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <Stat label="Добавится" value={preview.stats.createCount} />
              <Stat label="Обновится" value={preview.stats.updateCount} />
              <Stat
                label="С ошибками"
                value={preview.stats.errorCount}
                tone={preview.stats.errorCount > 0 ? "danger" : "default"}
              />
              <Stat
                label="Дубликаты"
                value={preview.stats.duplicateExtra}
                tone={preview.stats.duplicateExtra > 0 ? "warning" : "default"}
              />
              <Stat label="Новые бренды" value={preview.stats.newBrands} />
              <Stat label="Новые категории" value={preview.stats.newCategories} />
            </dl>

            <p className="mt-3 text-xs text-muted">
              Всего строк данных:{" "}
              {preview.stats.totalRows.toLocaleString("ru-RU")}. Дубликаты
              артикулов внутри файла: побеждает последняя строка, лишние
              показываются отдельно.
            </p>

            {preview.warnings.length > 0 ? (
              <ul className="mt-3 space-y-1 rounded-control bg-tint px-3 py-2 text-xs text-muted">
                {preview.warnings.map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            ) : null}

            {preview.newBrands.length > 0 ||
            preview.newCategories.length > 0 ? (
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {preview.newBrands.length > 0 ? (
                  <div className="rounded-control bg-tint px-3 py-2 text-xs text-ink">
                    <span className="font-semibold">Бренды: </span>
                    {preview.newBrands.join(", ")}
                  </div>
                ) : null}
                {preview.newCategories.length > 0 ? (
                  <div className="rounded-control bg-tint px-3 py-2 text-xs text-ink">
                    <span className="font-semibold">Категории: </span>
                    {preview.newCategories.join(", ")}
                  </div>
                ) : null}
              </div>
            ) : null}
          </section>

          {preview.errors.length > 0 ? (
            <section className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
              <div className="border-b border-line p-4 sm:p-5">
                <h3 className="text-base font-bold text-ink">
                  Строки с ошибками
                </h3>
                <p className="mt-1 text-xs text-muted">
                  Показаны первые {preview.errors.length} из{" "}
                  {preview.stats.errorCount}. Такие строки не импортируются.
                </p>
              </div>
              <ul className="max-h-72 divide-y divide-line overflow-auto">
                {preview.errors.map((issue) => (
                  <li
                    key={`${issue.rowNumber}-${issue.reason}`}
                    className="flex flex-col gap-1 px-4 py-2 text-xs sm:flex-row sm:items-center sm:gap-3"
                  >
                    <span className="w-16 shrink-0 font-mono font-semibold text-muted">
                      Стр. {issue.rowNumber}
                    </span>
                    <span className="w-32 shrink-0 truncate font-medium text-ink">
                      {issue.article || "—"}
                    </span>
                    <span className="text-danger">{issue.reason}</span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {preview.duplicates.length > 0 ? (
            <section className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
              <div className="border-b border-line p-4 sm:p-5">
                <h3 className="text-base font-bold text-ink">
                  Дубликаты артикулов в файле
                </h3>
                <p className="mt-1 text-xs text-muted">
                  Показаны первые {preview.duplicates.length}. При импорте
                  используется последняя строка.
                </p>
              </div>
              <ul className="max-h-60 divide-y divide-line overflow-auto">
                {preview.duplicates.map((duplicate) => (
                  <li
                    key={duplicate.article}
                    className="flex flex-wrap items-center gap-2 px-4 py-2 text-xs"
                  >
                    <span className="font-medium text-ink">
                      {duplicate.article}
                    </span>
                    <span className="text-muted">
                      строки: {duplicate.rows.join(", ")}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section className="overflow-hidden rounded-card border border-line bg-surface shadow-card">
            <div className="border-b border-line p-4 sm:p-5">
              <h3 className="text-base font-bold text-ink">
                Что запишется
              </h3>
              <p className="mt-1 text-xs text-muted">
                Первые {preview.sample.length} товаров после очистки цен и
                остатков.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] border-collapse text-left text-xs">
                <thead className="bg-page">
                  <tr>
                    {[
                      "Стр.",
                      "Артикул",
                      "Название",
                      "Цена",
                      "Остаток",
                      "Бренд",
                      "Категория",
                      "Действие",
                    ].map((label) => (
                      <th
                        key={label}
                        className="whitespace-nowrap border-b border-line px-2 py-2 font-semibold text-muted"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.sample.map((row) => (
                    <tr key={`${row.rowNumber}-${row.article}`}>
                      <td className="border-b border-line px-2 py-1.5 text-muted">
                        {row.rowNumber}
                      </td>
                      <td className="border-b border-line px-2 py-1.5 font-mono text-ink">
                        {row.article}
                      </td>
                      <td className="max-w-56 truncate border-b border-line px-2 py-1.5 text-ink">
                        {row.name}
                      </td>
                      <td className="whitespace-nowrap border-b border-line px-2 py-1.5 text-ink">
                        {formatPrice(row.price)}
                      </td>
                      <td className="border-b border-line px-2 py-1.5 text-ink">
                        {row.quantity === null ? "—" : row.quantity}
                      </td>
                      <td className="border-b border-line px-2 py-1.5 text-ink">
                        {row.brand}
                      </td>
                      <td className="border-b border-line px-2 py-1.5 text-ink">
                        {row.category}
                      </td>
                      <td className="border-b border-line px-2 py-1.5">
                        <span
                          className={cn(
                            "inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold",
                            row.action === "add"
                              ? "bg-success-soft text-success"
                              : "bg-brand-50 text-brand",
                          )}
                        >
                          {actionLabels[row.action]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              size="md"
              onClick={() => void handleImport()}
              disabled={busy || preview.stats.validRows === 0}
            >
              {busy
                ? "Импортируем…"
                : `Импортировать ${preview.stats.validRows.toLocaleString("ru-RU")} товаров`}
            </Button>
            {preview.stats.validRows === 0 ? (
              <span className="text-xs font-medium text-danger">
                Нет корректных строк — исправьте сопоставление или файл.
              </span>
            ) : (
              <span className="text-xs text-muted">
                Запись пакетами по 500 строк. Товары, которых нет в файле, не
                удаляются.
              </span>
            )}
          </div>
        </>
      ) : null}

      {step === "importing" ? (
        <section className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-6">
          <h2 className="text-lg font-bold tracking-tight text-ink">
            Записываем товары
          </h2>
          <p className="mt-1 text-sm text-muted">
            Не закрывайте страницу. Импорт идёт пакетами в транзакциях.
          </p>

          <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-tint">
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="font-medium text-ink">
              {progress.processed.toLocaleString("ru-RU")} из{" "}
              {progress.total.toLocaleString("ru-RU")} строк
            </span>
            <span className="text-muted">{progressPercent}%</span>
          </div>

          <p className="mt-2 text-xs text-muted">
            Добавлено: {progress.added.toLocaleString("ru-RU")} · Обновлено:{" "}
            {progress.updated.toLocaleString("ru-RU")}
          </p>
        </section>
      ) : null}

      {step === "done" && result ? (
        <section className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-6">
          <h2 className="text-lg font-bold tracking-tight text-ink">
            Импорт завершён
          </h2>
          <p className="mt-1 text-sm text-muted">
            {analysis?.fileName ?? "Файл"} обработан.
          </p>
          <dl className="mt-4 grid grid-cols-3 gap-2">
            <Stat label="Добавлено" value={result.added} />
            <Stat label="Обновлено" value={result.updated} />
            <Stat label="Всего записано" value={result.total} />
          </dl>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button type="button" variant="secondary" onClick={resetWizard}>
              Импортировать другой файл
            </Button>
            <Button type="button" variant="secondary" onClick={() => setStep("preview")}>
              Вернуться к предпросмотру
            </Button>
          </div>
        </section>
      ) : null}

      {latestRun ? (
        <section className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
          <h2 className="text-base font-bold tracking-tight text-ink">
            Обнулить остаток у отсутствующих
          </h2>
          <p className="mt-1 text-sm text-muted">
            Последний импорт: «{latestRun.fileName}» от{" "}
            {formatRunDate(latestRun.createdAt)} · добавлено{" "}
            {latestRun.createdCount}, обновлено {latestRun.updatedCount}.
          </p>
          <p className="mt-2 text-xs text-muted">
            Кнопка поставит остаток 0 у всех товаров, чьих артикулов не было в
            этом файле. Сами товары не удаляются. Сравнение идёт по
            нормализованному артикулу: регистр, пробелы и дефисы не важны.
          </p>
          <div className="mt-3">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => void handleResetMissing()}
              disabled={busy}
            >
              Обнулить остаток у отсутствующих
            </Button>
          </div>
          {resetMessage ? (
            <p className="mt-3 rounded-control bg-success-soft px-3 py-2 text-xs font-medium text-success">
              {resetMessage}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  );
}

type PriceSettingsProps = {
  settings: ImportSettings;
  currencyInfo: (typeof IMPORT_CURRENCIES)[number];
  onChange: (settings: ImportSettings) => void;
  onCurrencyChange: (currency: ImportCurrency) => void;
};

function PriceSettings({
  settings,
  currencyInfo,
  onChange,
  onCurrencyChange,
}: PriceSettingsProps) {
  return (
    <section className="rounded-card border border-line bg-page p-3 sm:p-4">
      <h3 className="text-sm font-bold text-ink">
        Валюта файла и пересчёт
      </h3>
      <p className="mt-1 text-xs text-muted">
        Цена на сайте хранится в тенге: цена × курс × (1 + наценка).{" "}
        {currencyInfo.symbol} = {currencyInfo.label}.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <label className="space-y-1.5">
          <span className="block text-xs font-semibold text-muted">
            Валюта цены в файле
          </span>
          <select
            value={settings.currency}
            onChange={(event) =>
              onCurrencyChange(event.target.value as ImportCurrency)
            }
            className={cn(fieldControlClass(false), "h-10")}
          >
            {IMPORT_CURRENCIES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.symbol} {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1.5">
          <span className="block text-xs font-semibold text-muted">
            Курс к тенге, ₸
          </span>
          <input
            type="number"
            min={0.0001}
            step={0.01}
            value={settings.currency === "KZT" ? 1 : settings.rate}
            disabled={settings.currency === "KZT"}
            onChange={(event) =>
              onChange({ ...settings, rate: Number(event.target.value) })
            }
            className={cn(fieldControlClass(false), "h-10")}
          />
        </label>

        <label className="space-y-1.5">
          <span className="block text-xs font-semibold text-muted">
            Наценка, %
          </span>
          <input
            type="number"
            step={0.1}
            value={settings.markup}
            onChange={(event) =>
              onChange({ ...settings, markup: Number(event.target.value) })
            }
            className={cn(fieldControlClass(false), "h-10")}
          />
        </label>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "danger" | "warning";
}) {
  return (
    <div className="rounded-card border border-line bg-page p-3">
      <dt className="text-[11px] font-semibold uppercase tracking-wide text-muted">
        {label}
      </dt>
      <dd
        className={cn(
          "mt-1 text-xl font-bold",
          tone === "danger"
            ? "text-danger"
            : tone === "warning"
              ? "text-brand"
              : "text-ink",
        )}
      >
        {value.toLocaleString("ru-RU")}
      </dd>
    </div>
  );
}
