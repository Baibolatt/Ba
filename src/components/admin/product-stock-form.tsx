"use client";

import { useActionState } from "react";
import {
  updateProductAction,
  type AdminActionState,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/form-fields";
import { cn } from "@/lib/cn";

const initialState: AdminActionState = { status: "idle" };

type ProductStockFormProps = {
  productId: string;
  price: number;
  quantity: number;
};

export function ProductStockForm({
  productId,
  price,
  quantity,
}: ProductStockFormProps) {
  const [state, formAction, pending] = useActionState(
    updateProductAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-2 lg:justify-end"
    >
      <input type="hidden" name="productId" value={productId} />
      <label className="space-y-1">
        <span className="block text-[11px] font-semibold text-muted">
          Цена, ₸
        </span>
        <input
          name="price"
          type="number"
          min={0}
          max={100_000_000}
          step={1}
          required
          inputMode="numeric"
          defaultValue={price}
          className={cn(fieldControlClass(false), "h-10 w-32")}
        />
      </label>
      <label className="space-y-1">
        <span className="block text-[11px] font-semibold text-muted">
          Остаток, шт.
        </span>
        <input
          name="quantity"
          type="number"
          min={0}
          max={1_000_000}
          step={1}
          required
          inputMode="numeric"
          defaultValue={quantity}
          className={cn(fieldControlClass(false), "h-10 w-24")}
        />
      </label>
      <Button type="submit" size="sm" variant="primary" disabled={pending}>
        {pending ? "Сохраняем…" : "Сохранить"}
      </Button>
      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={cn(
            "basis-full text-xs font-medium lg:text-right",
            state.status === "error" ? "text-danger" : "text-brand",
          )}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
