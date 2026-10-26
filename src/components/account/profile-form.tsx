"use client";

import { useActionState } from "react";
import type { CurrentUser } from "@/lib/auth";
import {
  updateProfileAction,
  type ProfileActionState,
} from "@/lib/auth-actions";
import { formatPhone } from "@/lib/phone";
import { TextField } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

const initialState: ProfileActionState = { status: "idle" };

export function ProfileForm({ user }: { user: CurrentUser }) {
  const [state, formAction, pending] = useActionState(
    updateProfileAction,
    initialState,
  );
  const fieldErrors = state.fieldErrors ?? {};

  return (
    <form noValidate action={formAction} className="space-y-4">
      <section className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
        <h2 className="text-base font-bold text-ink">Контактные данные</h2>
        <p className="mt-1 text-xs text-muted">
          Используются для связи по заказам.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField
            label="Имя"
            name="name"
            defaultValue={user.name}
            error={fieldErrors.name}
            autoComplete="name"
            required
          />
          <TextField
            label="Телефон"
            name="phone"
            type="tel"
            defaultValue={formatPhone(user.phone)}
            hint="Используется для входа в кабинет"
            error={fieldErrors.phone}
            autoComplete="tel"
            required
          />
        </div>
      </section>

      <section className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
        <h2 className="text-base font-bold text-ink">Адрес по умолчанию</h2>
        <p className="mt-1 text-xs text-muted">
          Подставим при оформлении доставки курьером.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField
            label="Город"
            name="city"
            defaultValue={user.city}
            error={fieldErrors.city}
            autoComplete="address-level2"
          />
          <TextField
            label="Улица, дом, квартира"
            name="address"
            defaultValue={user.address}
            error={fieldErrors.address}
            autoComplete="street-address"
          />
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p
          className={
            state.status === "error"
              ? "text-xs font-medium text-danger"
              : "text-[11px] leading-relaxed text-muted"
          }
          aria-live="polite"
        >
          {state.status === "error"
            ? state.message
            : "Данные хранятся в базе и используются только для заказов."}
        </p>
        <div className="flex items-center gap-3">
          {state.status === "success" ? (
            <span className="flex items-center gap-1.5 rounded-full bg-tint px-3 py-1.5 text-xs font-semibold text-brand">
              <Icon name="check" className="size-3.5" strokeWidth={2.5} />
              {state.message}
            </span>
          ) : null}
          <Button type="submit" variant="accent" disabled={pending}>
            {pending ? "Сохраняем…" : "Сохранить изменения"}
          </Button>
        </div>
      </div>
    </form>
  );
}
