"use client";

import { useActionState } from "react";
import {
  updateOrderStatusAction,
  type AdminActionState,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { fieldControlClass } from "@/components/ui/form-fields";
import { cn } from "@/lib/cn";
import { orderStatusLabels } from "@/lib/format";
import type { OrderStatus } from "@/lib/types";

const initialState: AdminActionState = { status: "idle" };

const statuses: OrderStatus[] = ["new", "in_progress", "done", "cancelled"];

type OrderStatusFormProps = {
  orderId: string;
  status: OrderStatus;
};

export function OrderStatusForm({ orderId, status }: OrderStatusFormProps) {
  const [state, formAction, pending] = useActionState(
    updateOrderStatusAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="flex flex-wrap items-end gap-2 lg:justify-end"
    >
      <input type="hidden" name="orderId" value={orderId} />
      <label className="space-y-1">
        <span className="block text-[11px] font-semibold text-muted">
          Статус
        </span>
        <select
          key={status}
          name="status"
          defaultValue={status}
          className={cn(fieldControlClass(false), "h-10 w-40 pr-8")}
        >
          {statuses.map((value) => (
            <option key={value} value={value}>
              {orderStatusLabels[value]}
            </option>
          ))}
        </select>
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
