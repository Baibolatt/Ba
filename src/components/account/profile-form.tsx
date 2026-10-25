"use client";

import { useState, type FormEvent } from "react";
import { profile } from "@/lib/mock-data";
import { TextField } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export function ProfileForm() {
  const [form, setForm] = useState(profile);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  const update = (key: keyof typeof form, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
    setSaved(false);
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
    if (!form.city.trim()) next.city = "Укажите город";

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSaved(true);
  };

  return (
    <form noValidate onSubmit={onSubmit} className="space-y-4">
      <section className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
        <h2 className="text-base font-bold text-ink">Контактные данные</h2>
        <p className="mt-1 text-xs text-muted">
          Используются для связи по заказам.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <TextField
            label="Имя"
            name="name"
            value={form.name}
            onChange={(event) => update("name", event.target.value)}
            error={errors.name}
            autoComplete="given-name"
          />
          <TextField
            label="Фамилия"
            name="lastName"
            value={form.lastName}
            onChange={(event) => update("lastName", event.target.value)}
            autoComplete="family-name"
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={(event) => update("email", event.target.value)}
            error={errors.email}
            autoComplete="email"
          />
          <TextField
            label="Телефон"
            name="phone"
            type="tel"
            value={form.phone}
            onChange={(event) => update("phone", event.target.value)}
            error={errors.phone}
            autoComplete="tel"
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
            value={form.city}
            onChange={(event) => update("city", event.target.value)}
            error={errors.city}
            autoComplete="address-level2"
          />
          <TextField
            label="Улица, дом, квартира"
            name="address"
            value={form.address}
            onChange={(event) => update("address", event.target.value)}
            autoComplete="street-address"
          />
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] leading-relaxed text-muted">
          Демо-режим: изменения не сохраняются в базе.
        </p>
        <div className="flex items-center gap-3">
          {saved ? (
            <span className="flex items-center gap-1.5 rounded-full bg-tint px-3 py-1.5 text-xs font-semibold text-brand">
              <Icon name="check" className="size-3.5" strokeWidth={2.5} />
              Сохранено
            </span>
          ) : null}
          <Button type="submit" variant="accent">
            Сохранить изменения
          </Button>
        </div>
      </div>
    </form>
  );
}
