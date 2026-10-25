"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { TextField, CheckboxField } from "@/components/ui/form-fields";
import { PasswordField } from "@/components/auth/password-field";
import { Button } from "@/components/ui/button";

export function RegisterForm() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirm: "",
    consent: false,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const update = <K extends keyof typeof form>(
    key: K,
    value: (typeof form)[K],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: Record<string, string> = {};

    if (!form.name.trim()) next.name = "Укажите имя";
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      next.email = "Введите корректный email";
    }
    if (form.phone.replace(/\D/g, "").length < 10) {
      next.phone = "Укажите телефон";
    }
    if (form.password.length < 6) next.password = "Минимум 6 символов";
    if (form.confirm !== form.password) {
      next.confirm = "Пароли не совпадают";
    }
    if (!form.consent) next.consent = "Нужно согласие на обработку данных";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setLoading(true);
    router.push("/account");
  };

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-4">
      <TextField
        label="Имя"
        name="name"
        value={form.name}
        onChange={(event) => update("name", event.target.value)}
        error={errors.name}
        autoComplete="given-name"
        required
      />
      <TextField
        label="Email"
        name="email"
        type="email"
        value={form.email}
        onChange={(event) => update("email", event.target.value)}
        error={errors.email}
        autoComplete="email"
        required
      />
      <TextField
        label="Телефон"
        name="phone"
        type="tel"
        value={form.phone}
        onChange={(event) => update("phone", event.target.value)}
        error={errors.phone}
        autoComplete="tel"
        required
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <PasswordField
          label="Пароль"
          name="password"
          value={form.password}
          onChange={(event) => update("password", event.target.value)}
          error={errors.password}
          autoComplete="new-password"
          required
        />
        <PasswordField
          label="Повторите пароль"
          name="confirm"
          value={form.confirm}
          onChange={(event) => update("confirm", event.target.value)}
          error={errors.confirm}
          autoComplete="new-password"
          required
        />
      </div>

      <CheckboxField
        name="consent"
        checked={form.consent}
        onChange={(event) => update("consent", event.target.checked)}
        error={errors.consent}
        label="Согласен на обработку персональных данных."
      />

      <Button type="submit" variant="accent" className="w-full">
        {loading ? "Создаём аккаунт…" : "Зарегистрироваться"}
      </Button>

      <p className="rounded-control bg-page p-3 text-[11px] leading-relaxed text-muted">
        Демо-режим: аккаунт не создаётся. После отправки откроется личный
        кабинет с тестовыми данными.
      </p>
    </form>
  );
}
