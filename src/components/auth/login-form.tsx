"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { TextField, CheckboxField } from "@/components/ui/form-fields";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("alexey@example.kz");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: Record<string, string> = {};

    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Введите корректный email";
    if (password.length < 6) next.password = "Минимум 6 символов";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    router.push("/account");
  };

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-4">
      <TextField
        label="Email"
        name="email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={errors.email}
        autoComplete="email"
        required
      />
      <PasswordField
        label="Пароль"
        name="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={errors.password}
        autoComplete="current-password"
        required
      />

      <div className="flex items-center justify-between gap-3">
        <CheckboxField
          name="remember"
          checked={remember}
          onChange={(event) => setRemember(event.target.checked)}
          label="Запомнить меня"
        />
        <Link
          href="/feedback"
          className="text-xs font-medium text-brand underline-offset-2 hover:underline"
        >
          Не помню пароль
        </Link>
      </div>

      <Button type="submit" variant="accent" className="w-full">
        {loading ? "Входим…" : "Войти"}
      </Button>

      <p className="rounded-control bg-page p-3 text-[11px] leading-relaxed text-muted">
        Демо-режим: подойдёт любой email и пароль от 6 символов. Данные никуда
        не отправляются.
      </p>
    </form>
  );
}
