"use client";

import { useActionState } from "react";
import { TextField, CheckboxField } from "@/components/ui/form-fields";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { registerAction, type AuthActionState } from "@/lib/auth-actions";

const initialState: AuthActionState = {};

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(
    registerAction,
    initialState,
  );

  return (
    <form noValidate action={formAction} className="space-y-4">
      <TextField
        label="Имя"
        name="name"
        error={state.fieldErrors?.name}
        autoComplete="name"
        required
      />
      <TextField
        label="Телефон"
        name="phone"
        type="tel"
        placeholder="+7 (700) 000-00-00"
        hint="По этому номеру вы будете входить в кабинет"
        error={state.fieldErrors?.phone}
        autoComplete="tel"
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <PasswordField
          label="Пароль"
          name="password"
          error={state.fieldErrors?.password}
          autoComplete="new-password"
          hint="Минимум 8 символов"
          required
        />
        <PasswordField
          label="Повторите пароль"
          name="confirm"
          error={state.fieldErrors?.confirm}
          autoComplete="new-password"
          required
        />
      </div>

      <CheckboxField
        name="consent"
        error={state.fieldErrors?.consent}
        label="Согласен на обработку персональных данных."
      />

      {state.error ? (
        <p className="flex items-start gap-2 rounded-control bg-danger-soft p-3 text-xs font-medium text-danger">
          <Icon name="alertCircle" className="mt-0.5 size-4 shrink-0" />
          {state.error}
        </p>
      ) : null}

      <Button type="submit" variant="accent" className="w-full" disabled={pending}>
        {pending ? "Создаём аккаунт…" : "Зарегистрироваться"}
      </Button>
    </form>
  );
}
