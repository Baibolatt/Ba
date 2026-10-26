"use client";

import { useRouter } from "next/navigation";
import { Fragment, useState, type FormEvent } from "react";
import { cn } from "@/lib/cn";
import type { CurrentUser } from "@/lib/auth";
import type { Product } from "@/lib/types";
import { createOrderAction } from "@/app/checkout/actions";
import { useStore } from "@/components/providers/store-provider";
import { OrderSummary } from "@/components/cart/order-summary";
import {
  CheckboxField,
  TextareaField,
  TextField,
} from "@/components/ui/form-fields";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon } from "@/components/ui/icon";

type Step = 1 | 2 | 3;
type Delivery = "pickup" | "courier";
type Payment = "on-delivery" | "card-courier" | "invoice";

type FormState = {
  name: string;
  phone: string;
  email: string;
  city: string;
  street: string;
  house: string;
  flat: string;
  comment: string;
  delivery: Delivery;
  payment: Payment;
  consent: boolean;
};

const steps: Array<{ n: Step; label: string }> = [
  { n: 1, label: "Контакты" },
  { n: 2, label: "Доставка" },
  { n: 3, label: "Оплата" },
];

export function CheckoutView({
  products,
  customer,
}: {
  products: Product[];
  customer: CurrentUser | null;
}) {
  const router = useRouter();
  const { cart, clearCart } = useStore();
  const [step, setStep] = useState<Step>(1);
  const [placing, setPlacing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState("");
  const [form, setForm] = useState<FormState>({
    name: customer?.name ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    city: customer?.city ?? "",
    street: customer?.address ?? "",
    house: "",
    flat: "",
    comment: "",
    delivery: "pickup",
    payment: "on-delivery",
    consent: false,
  });

  const lines = cart.flatMap((line) => {
    const product = products.find((item) => item.id === line.productId);
    return product ? [{ product, qty: line.qty }] : [];
  });

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const validateStep = (target: Step): boolean => {
    const next: Record<string, string> = {};

    if (target === 1) {
      if (!form.name.trim()) next.name = "Укажите имя и фамилию";
      if (form.phone.replace(/\D/g, "").length < 10) {
        next.phone = "Укажите телефон в формате +7 (700) 000-00-00";
      }
      if (!/^\S+@\S+\.\S+$/.test(form.email)) {
        next.email = "Укажите корректный email";
      }
    }

    if (target === 2 && form.delivery === "courier") {
      if (!form.city.trim()) next.city = "Укажите город";
      if (!form.street.trim()) next.street = "Укажите улицу";
      if (!form.house.trim()) next.house = "Укажите дом";
    }

    if (target === 3 && !form.consent) {
      next.consent = "Без согласия на обработку данных нельзя оформить заказ";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateStep(step)) return;

    if (step < 3) {
      setServerError("");
      setStep((current) => (current + 1) as Step);
      return;
    }

    setPlacing(true);
    setServerError("");

    try {
      const result = await createOrderAction({
        customerName: form.name,
        phone: form.phone,
        email: form.email,
        deliveryMethod: form.delivery,
        city: form.city,
        street: form.street,
        house: form.house,
        flat: form.flat,
        comment: form.comment,
        payment: form.payment,
        consent: form.consent,
        items: cart.map((line) => ({
          productId: line.productId,
          qty: line.qty,
        })),
      });

      if (!result.ok) {
        if (result.fieldErrors) setErrors(result.fieldErrors);
        if (result.step) setStep(result.step);
        setServerError(result.error);
        setPlacing(false);
        return;
      }

      clearCart();
      router.push(`/checkout/success?order=${encodeURIComponent(result.orderId)}`);
    } catch {
      setServerError("Не удалось связаться с сервером. Попробуйте ещё раз.");
      setPlacing(false);
    }
  };

  if (placing) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-line bg-surface py-20 shadow-card">
        <span className="size-8 animate-spin rounded-full border-2 border-line border-t-brand" />
        <p className="mt-4 text-sm font-medium text-ink">Оформляем заказ…</p>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <EmptyState
        icon="cart"
        title="Нечего оформлять"
        description="Корзина пуста. Добавьте товары, чтобы перейти к оформлению заказа."
        action={<ButtonLink href="/catalog">Перейти в каталог</ButtonLink>}
      />
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:gap-6">
      <form
        noValidate
        onSubmit={onSubmit}
        className="min-w-0 rounded-card border border-line bg-surface shadow-card"
      >
        <div className="flex items-center border-b border-line px-4 py-3.5 sm:px-5">
          {steps.map((item, index) => {
            const done = step > item.n;
            const current = step === item.n;
            return (
              <Fragment key={item.n}>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      done && "bg-brand text-white",
                      current && "bg-brand text-white",
                      !done && !current && "border border-line bg-surface text-muted",
                    )}
                  >
                    {done ? (
                      <Icon name="check" className="size-3.5" strokeWidth={2.5} />
                    ) : (
                      item.n
                    )}
                  </span>
                  <span
                    className={cn(
                      "text-[11px] font-semibold sm:text-xs",
                      current ? "text-ink" : "text-muted",
                    )}
                  >
                    {item.label}
                  </span>
                </div>
                {index < steps.length - 1 ? (
                  <span
                    className={cn(
                      "mx-2 h-px flex-1 sm:mx-3",
                      step > item.n ? "bg-brand" : "bg-line",
                    )}
                  />
                ) : null}
              </Fragment>
            );
          })}
        </div>

        <div className="p-4 sm:p-5">
          {step === 1 ? (
            <div>
              <h2 className="text-base font-bold text-ink">
                Контактные данные
              </h2>
              <p className="mt-1 text-xs text-muted">
                По ним свяжемся при сборке заказа.
              </p>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <TextField
                  label="Имя и фамилия"
                  name="name"
                  value={form.name}
                  onChange={(event) => update("name", event.target.value)}
                  error={errors.name}
                  autoComplete="name"
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
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={(event) => update("email", event.target.value)}
                  error={errors.email}
                  autoComplete="email"
                  wrapperClassName="sm:col-span-2"
                  required
                />
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div>
              <h2 className="text-base font-bold text-ink">Способ получения</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-card border p-3 transition-colors",
                    form.delivery === "pickup"
                      ? "border-brand bg-brand-50"
                      : "border-line hover:border-brand/30",
                  )}
                >
                  <input
                    type="radio"
                    name="delivery"
                    value="pickup"
                    checked={form.delivery === "pickup"}
                    onChange={() => update("delivery", "pickup")}
                    className="mt-0.5 size-4 accent-brand"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-ink">
                      Самовывоз
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      Тараз, ул. Жибек Жолы, 12 · сегодня
                    </span>
                  </span>
                </label>
                <label
                  className={cn(
                    "flex cursor-pointer gap-3 rounded-card border p-3 transition-colors",
                    form.delivery === "courier"
                      ? "border-brand bg-brand-50"
                      : "border-line hover:border-brand/30",
                  )}
                >
                  <input
                    type="radio"
                    name="delivery"
                    value="courier"
                    checked={form.delivery === "courier"}
                    onChange={() => update("delivery", "courier")}
                    className="mt-0.5 size-4 accent-brand"
                  />
                  <span>
                    <span className="block text-sm font-semibold text-ink">
                      Курьером
                    </span>
                    <span className="mt-0.5 block text-xs text-muted">
                      Доставка по области после сборки
                    </span>
                  </span>
                </label>
              </div>

              {form.delivery === "courier" ? (
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
                    label="Улица"
                    name="street"
                    value={form.street}
                    onChange={(event) => update("street", event.target.value)}
                    error={errors.street}
                    autoComplete="address-line1"
                  />
                  <TextField
                    label="Дом"
                    name="house"
                    value={form.house}
                    onChange={(event) => update("house", event.target.value)}
                    error={errors.house}
                  />
                  <TextField
                    label="Квартира или офис"
                    name="flat"
                    value={form.flat}
                    onChange={(event) => update("flat", event.target.value)}
                    autoComplete="address-line2"
                  />
                </div>
              ) : (
                <div className="mt-4 flex items-start gap-2.5 rounded-control bg-brand-50 p-3 text-xs text-brand">
                  <Icon name="mapPin" className="mt-0.5 size-4 shrink-0" />
                  <span>
                    Заберите заказ по адресу: Тараз, ул. Жибек Жолы, 12. Пункт
                    выдачи работает ежедневно с 9:00 до 20:00.
                  </span>
                </div>
              )}

              <div className="mt-4">
                <TextareaField
                  label="Комментарий к заказу"
                  name="comment"
                  value={form.comment}
                  onChange={(event) => update("comment", event.target.value)}
                  placeholder="Например, удобное время доставки"
                  hint="Необязательно"
                />
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div>
              <h2 className="text-base font-bold text-ink">Способ оплаты</h2>
              <div className="mt-3 space-y-2">
                {[
                  {
                    value: "on-delivery" as Payment,
                    title: "При получении",
                    text: "Наличными или картой в пункте выдачи",
                  },
                  {
                    value: "card-courier" as Payment,
                    title: "Картой курьеру",
                    text: "Оплата при доставке по адресу",
                  },
                  {
                    value: "invoice" as Payment,
                    title: "По счёту для юрлица",
                    text: "Счёт и закрывающие документы",
                  },
                ].map((option) => (
                  <label
                    key={option.value}
                    className={cn(
                      "flex cursor-pointer gap-3 rounded-card border p-3 transition-colors",
                      form.payment === option.value
                        ? "border-brand bg-brand-50"
                        : "border-line hover:border-brand/30",
                    )}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={option.value}
                      checked={form.payment === option.value}
                      onChange={() => update("payment", option.value)}
                      className="mt-0.5 size-4 accent-brand"
                    />
                    <span>
                      <span className="block text-sm font-semibold text-ink">
                        {option.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {option.text}
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              <div className="mt-4">
                <CheckboxField
                  name="consent"
                  checked={form.consent}
                  onChange={(event) => update("consent", event.target.checked)}
                  error={errors.consent}
                  label="Согласен на обработку персональных данных и принимаю условия заказа."
                />
              </div>

              <p className="mt-4 rounded-control bg-page p-3 text-[11px] leading-relaxed text-muted">
                Заказ сохранится в базе и появится в личном кабинете. Оплата не
                проводится — менеджер подтвердит заказ по телефону.
              </p>
            </div>
          ) : null}

          {serverError ? (
            <p
              role="alert"
              className="mt-4 flex items-start gap-2 rounded-control bg-danger-soft p-3 text-xs font-medium text-danger"
            >
              <Icon
                name="alertCircle"
                className="mt-0.5 size-4 shrink-0"
              />
              {serverError}
            </p>
          ) : null}

          <div className="mt-6 flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
            {step > 1 ? (
              <Button
                variant="secondary"
                onClick={() => setStep((current) => (current - 1) as Step)}
              >
                <Icon name="arrowLeft" className="size-4" />
                Назад
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" variant="accent">
              {step < 3 ? (
                <>
                  Продолжить
                  <Icon name="arrowRight" className="size-4" />
                </>
              ) : (
                <>
                  <Icon name="check" className="size-4" />
                  Оформить заказ
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      <OrderSummary lines={lines} title="Ваш заказ">
        <p className="mt-3 text-[11px] leading-relaxed text-muted">
          {step === 3
            ? "После оформления заказ появится в личном кабинете."
            : "Способ оплаты выбирается на последнем шаге."}
        </p>
      </OrderSummary>
    </div>
  );
}
