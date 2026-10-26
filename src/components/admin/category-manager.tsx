"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  deleteCategoryAction,
  saveCategoryAction,
  type AdminActionState,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/form-fields";
import {
  categoryIcons,
  categoryIconLabels,
} from "@/lib/category-icons";
import { cn } from "@/lib/cn";
import type { Category } from "@/lib/types";

const initialState: AdminActionState = { status: "idle" };

const iconOptions = categoryIcons.map((icon) => ({
  value: icon,
  label: categoryIconLabels[icon],
}));

function StatusMessage({ state }: { state: AdminActionState }) {
  if (!state.message) return null;

  return (
    <p
      role={state.status === "error" ? "alert" : "status"}
      className={cn(
        "text-xs font-medium",
        state.status === "error" ? "text-danger" : "text-brand",
      )}
    >
      {state.message}
    </p>
  );
}

function CategoryFields({ category }: { category?: Category }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="space-y-1">
        <span className="block text-[11px] font-semibold text-muted">
          Название
        </span>
        <input
          name="name"
          required
          maxLength={100}
          defaultValue={category?.name}
          placeholder="Тормозная система"
          className={cn(fieldControlClass(false), "h-10")}
        />
      </label>
      <label className="space-y-1">
        <span className="block text-[11px] font-semibold text-muted">
          Короткое название
        </span>
        <input
          name="shortName"
          maxLength={40}
          defaultValue={category?.shortName}
          placeholder="Тормоза"
          className={cn(fieldControlClass(false), "h-10")}
        />
      </label>
      <label className="space-y-1">
        <span className="block text-[11px] font-semibold text-muted">
          Иконка
        </span>
        <select
          name="icon"
          defaultValue={category?.icon ?? "gear"}
          className={cn(fieldControlClass(false), "h-10 pr-8")}
        >
          {iconOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <label className="space-y-1">
        <span className="block text-[11px] font-semibold text-muted">
          Порядок сортировки
        </span>
        <input
          name="sortOrder"
          type="number"
          min={0}
          max={10_000}
          step={1}
          inputMode="numeric"
          defaultValue={category?.sortOrder ?? 0}
          className={cn(fieldControlClass(false), "h-10")}
        />
      </label>
      <label className="space-y-1 sm:col-span-2">
        <span className="block text-[11px] font-semibold text-muted">
          Описание
        </span>
        <textarea
          name="description"
          maxLength={1000}
          rows={2}
          defaultValue={category?.description}
          placeholder="Что входит в категорию"
          className={cn(fieldControlClass(false), "py-2")}
        />
      </label>
    </div>
  );
}

function CategoryCreateForm() {
  const [state, formAction, pending] = useActionState(
    saveCategoryAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <CategoryFields />
      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Добавляем…" : "Добавить категорию"}
        </Button>
        <span className="text-[11px] text-muted">
          Slug создастся из названия автоматически
        </span>
      </div>
      <StatusMessage state={state} />
    </form>
  );
}

function CategoryRow({ category }: { category: Category }) {
  const [saveState, saveAction, saving] = useActionState(
    saveCategoryAction,
    initialState,
  );
  const [deleteState, deleteAction, deleting] = useActionState(
    deleteCategoryAction,
    initialState,
  );
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="py-2">
      <details className="group">
        <summary className="flex cursor-pointer list-none flex-wrap items-center gap-x-3 gap-y-1 rounded-control px-2 py-2 hover:bg-page">
          <span className="text-sm font-semibold text-ink">
            {category.name}
          </span>
          <span className="font-mono text-[11px] text-muted">
            /{category.slug}
          </span>
          <span className="text-xs text-muted">
            {category.productCount} тов. · порядок {category.sortOrder}
          </span>
          <span className="ml-auto text-xs font-medium text-brand group-open:hidden">
            Изменить
          </span>
        </summary>

        <div className="space-y-3 border-t border-line px-2 pt-3">
          <form action={saveAction} className="space-y-3">
            <input type="hidden" name="categoryId" value={category.id} />
            <CategoryFields category={category} />
            <div className="flex flex-wrap items-center gap-2">
              <Button type="submit" size="sm" disabled={saving}>
                {saving ? "Сохраняем…" : "Сохранить"}
              </Button>
              {category.productCount > 0 ? (
                <span className="text-[11px] text-muted">
                  Удаление недоступно: в категории есть товары
                </span>
              ) : confirming ? (
                <>
                  <Button
                    type="submit"
                    size="sm"
                    variant="secondary"
                    disabled={deleting}
                    className="border-danger/40 text-danger hover:border-danger/60 hover:bg-danger-soft"
                    formAction={deleteAction}
                  >
                    {deleting ? "Удаляем…" : "Да, удалить"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => setConfirming(false)}
                    disabled={deleting}
                  >
                    Отмена
                  </Button>
                </>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => setConfirming(true)}
                >
                  Удалить категорию
                </Button>
              )}
            </div>
          </form>
          <StatusMessage state={saveState} />
          <StatusMessage state={deleteState} />
        </div>
      </details>
    </li>
  );
}

export function CategoryManager({
  categories,
}: {
  categories: Category[];
}) {
  return (
    <div className="space-y-3">
      <CategoryCreateForm />

      {categories.length === 0 ? (
        <p className="text-sm text-muted">Категорий пока нет.</p>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {categories.map((category) => (
            <CategoryRow key={category.id} category={category} />
          ))}
        </ul>
      )}
    </div>
  );
}
