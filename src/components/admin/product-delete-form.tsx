"use client";

import { useActionState, useState } from "react";
import {
  deleteProductAction,
  type AdminActionState,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

const initialState: AdminActionState = { status: "idle" };

type ProductDeleteFormProps = {
  productId: string;
  productName: string;
};

export function ProductDeleteForm({
  productId,
  productName,
}: ProductDeleteFormProps) {
  const [state, formAction, pending] = useActionState(
    deleteProductAction,
    initialState,
  );
  const [confirming, setConfirming] = useState(false);

  return (
    <div className="space-y-2">
      <form action={formAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="productId" value={productId} />
        {confirming ? (
          <>
            <span className="text-xs font-medium text-muted">
              Удалить «{productName}» навсегда?
            </span>
            <Button
              type="submit"
              size="sm"
              variant="secondary"
              disabled={pending}
              className="border-danger/40 text-danger hover:border-danger/60 hover:bg-danger-soft"
            >
              {pending ? "Удаляем…" : "Да, удалить"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => setConfirming(false)}
              disabled={pending}
            >
              Отмена
            </Button>
          </>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => setConfirming(true)}
          >
            Удалить товар
          </Button>
        )}
      </form>

      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={cn(
            "text-xs font-medium",
            state.status === "error" ? "text-danger" : "text-brand",
          )}
        >
          {state.message}
        </p>
      ) : null}
    </div>
  );
}
