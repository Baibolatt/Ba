"use client";

import {
  useActionState,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  deleteBrandAction,
  saveBrandAction,
  type AdminActionState,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/form-fields";
import { cn } from "@/lib/cn";
import type { BrandSummary } from "@/lib/types";

const initialState: AdminActionState = { status: "idle" };

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

function BrandCreateForm() {
  const [state, formAction, pending] = useActionState(
    saveBrandAction,
    initialState,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-2">
      <div className="flex flex-wrap items-end gap-2">
        <label className="min-w-0 flex-1 space-y-1">
          <span className="block text-[11px] font-semibold text-muted">
            Новый бренд
          </span>
          <input
            name="name"
            required
            maxLength={100}
            placeholder="Например, Brembo"
            className={cn(fieldControlClass(false), "h-10")}
          />
        </label>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Добавляем…" : "Добавить"}
        </Button>
      </div>
      <StatusMessage state={state} />
    </form>
  );
}

function BrandRow({ brand }: { brand: BrandSummary }) {
  const [saveState, saveAction, saving] = useActionState(
    saveBrandAction,
    initialState,
  );
  const [deleteState, deleteAction, deleting] = useActionState(
    deleteBrandAction,
    initialState,
  );
  const [confirming, setConfirming] = useState(false);

  return (
    <li className="space-y-2 py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <form action={saveAction} className="flex min-w-0 flex-1 items-center gap-2">
          <input type="hidden" name="brandId" value={brand.id} />
          <input
            name="name"
            required
            maxLength={100}
            defaultValue={brand.name}
            aria-label={`Название бренда ${brand.name}`}
            className={cn(fieldControlClass(false), "h-9 min-w-0 flex-1")}
          />
          <Button type="submit" size="sm" variant="secondary" disabled={saving}>
            {saving ? "Сохраняем…" : "Сохранить"}
          </Button>
        </form>

        <span className="text-xs text-muted">{brand.productCount} тов.</span>

        <form action={deleteAction} className="flex items-center gap-1">
          <input type="hidden" name="brandId" value={brand.id} />
          {brand.productCount > 0 ? (
            <span className="text-[11px] text-muted">есть товары</span>
          ) : confirming ? (
            <>
              <Button
                type="submit"
                size="sm"
                variant="secondary"
                disabled={deleting}
                className="border-danger/40 text-danger hover:border-danger/60 hover:bg-danger-soft"
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
              Удалить
            </Button>
          )}
        </form>
      </div>
      <StatusMessage state={saveState} />
      <StatusMessage state={deleteState} />
    </li>
  );
}

export function BrandManager({ brands }: { brands: BrandSummary[] }) {
  return (
    <div className="space-y-3">
      <BrandCreateForm />

      {brands.length === 0 ? (
        <p className="text-sm text-muted">Брендов пока нет.</p>
      ) : (
        <ul className="divide-y divide-line border-t border-line">
          {brands.map((brand) => (
            <BrandRow key={brand.id} brand={brand} />
          ))}
        </ul>
      )}
    </div>
  );
}
