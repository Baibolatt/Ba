"use client";

import Link from "next/link";
import { useActionState } from "react";
import { TextField, CheckboxField } from "@/components/ui/form-fields";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { loginAction, type AuthActionState } from "@/lib/auth-actions";

const initialState: AuthActionState = {};

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAction,
    initialState,
  );

  return (
    <form noValidate action={formAction} className="space-y-4">
      <TextField
        label="Телефон"
        name="phone"
        type="tel"
        placeholder="+7 (700) 000-00-00"
        error={state.fieldErrors?.phone}
        autoComplete="tel"
        required
      />
      <PasswordField
        label="Пароль"
        name="password"
        error={state.fieldErrors?.password}
        autoComplete="current-password"
        required
      />

      <div className="flex items-center justify-between gap-3">
        <CheckboxField
          name="remember"
          defaultChecked
          label="Запомнить меня"
        />
        <Link
          href="/feedback"
          className="text-xs font-medium text-brand underline-offset-2 hover:underline"
        >
          Не помню пароль
        </Link>
      </div>

      {state.error ? (
        <p className="flex items-start gap-2 rounded-control bg-danger-soft p-3 text-xs font-medium text-danger">
          <Icon name="alertCircle" className="mt-0.5 size-4 shrink-0" />
          {state.error}
        </p>
      ) : null}

      <Button type="submit" variant="accent" className="w-full" disabled={pending}>
        {pending ? "Входим…" : "Войти"}
      </Button>
    </form>
  );
}
