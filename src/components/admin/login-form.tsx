"use client";

import { useActionState } from "react";
import {
  loginAdminAction,
  type AdminLoginState,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/form-fields";

const initialState: AdminLoginState = {};

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(
    loginAdminAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-5 space-y-4">
      <TextField
        label="Пароль"
        name="password"
        type="password"
        required
        autoComplete="current-password"
        autoFocus
        error={state.error}
      />
      <Button
        type="submit"
        variant="primary"
        className="w-full"
        disabled={pending}
      >
        {pending ? "Проверяем…" : "Войти"}
      </Button>
    </form>
  );
}
