"use client";

import { useState, type FormEvent } from "react";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  CheckboxField,
  SelectField,
  TextareaField,
  TextField,
} from "@/components/ui/form-fields";
import { Icon } from "@/components/ui/icon";

type FormValues = {
  name: string;
  phone: string;
  email: string;
  topic: string;
  message: string;
  consent: boolean;
};

type FormErrors = Partial<Record<keyof FormValues, string>>;

const emptyValues: FormValues = {
  name: "",
  phone: "",
  email: "",
  topic: "",
  message: "",
  consent: false,
};

const topics = [
  { value: "", label: "Выберите тему" },
  { value: "part", label: "Подбор детали" },
  { value: "order", label: "Вопрос по заказу" },
  { value: "delivery", label: "Доставка и оплата" },
  { value: "return", label: "Возврат и гарантия" },
  { value: "b2b", label: "Сотрудничество и опт" },
  { value: "other", label: "Другое" },
];

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};

  if (values.name.trim().length < 2) {
    errors.name = "Укажите имя";
  }

  const phone = values.phone.replace(/\D/g, "");
  if (phone.length < 10) {
    errors.phone = "Укажите телефон для ответа";
  }

  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Проверьте адрес электронной почты";
  }

  if (!values.topic) {
    errors.topic = "Выберите тему обращения";
  }

  if (values.message.trim().length < 10) {
    errors.message = "Опишите вопрос подробнее — минимум 10 символов";
  }

  if (!values.consent) {
    errors.consent = "Нужно согласие на обработку данных";
  }

  return errors;
}

export function FeedbackForm() {
  const [values, setValues] = useState<FormValues>(emptyValues);
  const [errors, setErrors] = useState<FormErrors>({});
  const [sent, setSent] = useState(false);

  const update = <K extends keyof FormValues>(
    key: K,
    value: FormValues[K],
  ) => {
    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <div className="rounded-card border border-line bg-surface p-5 text-center shadow-card sm:p-6">
        <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-tint text-icon">
          <Icon name="check" className="size-7" />
        </span>
        <h2 className="mt-4 text-lg font-bold text-ink">Обращение отправлено</h2>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-muted">
          Спасибо, {values.name.trim()}. Ответим на{" "}
          <span className="font-medium text-ink">
            {values.phone || values.email}
          </span>{" "}
          в рабочее время склада.
        </p>
        <p className="mt-3 text-[11px] text-muted">
          Это демонстрационная форма — сообщение никуда не отправляется.
        </p>
        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
          <ButtonLink href="/catalog" variant="primary">
            Перейти в каталог
          </ButtonLink>
          <Button
            variant="secondary"
            onClick={() => {
              setValues(emptyValues);
              setErrors({});
              setSent(false);
            }}
          >
            Отправить ещё
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Имя"
          name="name"
          autoComplete="name"
          placeholder="Как к вам обращаться"
          value={values.name}
          error={errors.name}
          required
          onChange={(event) => update("name", event.target.value)}
        />
        <TextField
          label="Телефон"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          placeholder="+7 (___) ___-__-__"
          value={values.phone}
          error={errors.phone}
          required
          onChange={(event) => update("phone", event.target.value)}
        />
        <TextField
          label="Электронная почта"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="name@example.kz"
          hint="Необязательно"
          value={values.email}
          error={errors.email}
          onChange={(event) => update("email", event.target.value)}
        />
        <SelectField
          label="Тема"
          name="topic"
          options={topics}
          value={values.topic}
          error={errors.topic}
          required
          onChange={(event) => update("topic", event.target.value)}
        />
      </div>

      <TextareaField
        label="Сообщение"
        name="message"
        placeholder="Номер заявки, деталь или вопрос — чем подробнее, тем быстрее ответим"
        wrapperClassName="mt-4"
        value={values.message}
        error={errors.message}
        required
        onChange={(event) => update("message", event.target.value)}
      />

      <div className="mt-4">
        <CheckboxField
          label="Согласен на обработку персональных данных для ответа на обращение"
          name="consent"
          checked={values.consent}
          error={errors.consent}
          required
          onChange={(event) => update("consent", event.target.checked)}
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] text-muted">
          Ответим в течение рабочего дня. Демо-форма без отправки.
        </p>
        <Button type="submit" variant="accent">
          Отправить обращение
        </Button>
      </div>
    </form>
  );
}
