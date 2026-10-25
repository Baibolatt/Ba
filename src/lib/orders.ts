import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export type DeliveryMethod = "pickup" | "courier";
export type PaymentMethod = "on-delivery" | "card-courier" | "invoice";

export type CreateOrderInput = {
  customerName: string;
  phone: string;
  email: string;
  deliveryMethod: DeliveryMethod;
  city?: string;
  street?: string;
  house?: string;
  flat?: string;
  comment?: string;
  payment: PaymentMethod;
  consent: boolean;
  items: Array<{ productId: string; qty: number }>;
};

export type CreateOrderResult =
  | { ok: true; orderId: string; number: string }
  | {
      ok: false;
      error: string;
      fieldErrors?: Record<string, string>;
      step?: 1 | 2 | 3;
    };

const paymentLabels: Record<PaymentMethod, string> = {
  "on-delivery": "При получении",
  "card-courier": "Картой курьеру",
  invoice: "По счёту для юрлица",
};

const pickupAddress = "Тараз, пункт выдачи «Жибек Жолы, 12»";

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

function validateInput(input: CreateOrderInput): {
  fieldErrors: Record<string, string>;
  items: Array<{ productId: string; qty: number }>;
} {
  const fieldErrors: Record<string, string> = {};

  const customerName = text(input.customerName);
  const phone = text(input.phone);
  const email = text(input.email);
  const city = text(input.city);
  const street = text(input.street);
  const house = text(input.house);

  if (!customerName) {
    fieldErrors.name = "Укажите имя и фамилию";
  } else if (customerName.length > 120) {
    fieldErrors.name = "Имя слишком длинное";
  }

  const phoneDigits = digitsOnly(phone);
  if (phoneDigits.length < 10 || phoneDigits.length > 15) {
    fieldErrors.phone = "Укажите телефон в формате +7 (700) 000-00-00";
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    fieldErrors.email = "Укажите корректный email";
  }

  if (input.deliveryMethod !== "pickup" && input.deliveryMethod !== "courier") {
    fieldErrors.delivery = "Выберите способ получения";
  }

  if (input.deliveryMethod === "courier") {
    if (!city) fieldErrors.city = "Укажите город";
    if (!street) fieldErrors.street = "Укажите улицу";
    if (!house) fieldErrors.house = "Укажите дом";
  }

  if (
    input.payment !== "on-delivery" &&
    input.payment !== "card-courier" &&
    input.payment !== "invoice"
  ) {
    fieldErrors.payment = "Выберите способ оплаты";
  }

  if (!input.consent) {
    fieldErrors.consent =
      "Без согласия на обработку данных нельзя оформить заказ";
  }

  const raws = Array.isArray(input.items) ? input.items : [];
  const quantities = new Map<string, number>();

  for (const item of raws) {
    const productId = text(item?.productId);
    const qty = Number(item?.qty);

    if (!productId || !Number.isInteger(qty) || qty <= 0) {
      fieldErrors.items = "В корзине есть некорректный товар";
      continue;
    }

    if (qty > 99) {
      fieldErrors.items = "Максимальное количество одного товара — 99 шт.";
      continue;
    }

    quantities.set(productId, (quantities.get(productId) ?? 0) + qty);
  }

  const items = Array.from(quantities, ([productId, qty]) => ({
    productId,
    qty,
  }));

  if (items.length === 0) {
    fieldErrors.items = "Корзина пуста";
  }

  return { fieldErrors, items };
}

function errorStep(fieldErrors: Record<string, string>): 1 | 2 | 3 {
  if (
    fieldErrors.name ||
    fieldErrors.phone ||
    fieldErrors.email
  ) {
    return 1;
  }

  if (
    fieldErrors.delivery ||
    fieldErrors.city ||
    fieldErrors.street ||
    fieldErrors.house
  ) {
    return 2;
  }

  return 3;
}

async function nextOrderNumber(
  tx: Prisma.TransactionClient,
  now: Date,
): Promise<string> {
  const year = String(now.getFullYear()).slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const count = await tx.order.count({
    where: { createdAt: { gte: startOfDay } },
  });

  let sequence = count + 1;
  let number = `PH-${year}${month}${day}-${String(sequence).padStart(2, "0")}`;

  while (
    await tx.order.findUnique({ where: { number }, select: { id: true } })
  ) {
    sequence += 1;
    number = `PH-${year}${month}${day}-${String(sequence).padStart(2, "0")}`;
  }

  return number;
}

export async function createOrder(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  const { fieldErrors, items } = validateInput(input);

  if (Object.keys(fieldErrors).length > 0) {
    return {
      ok: false,
      error: "Проверьте данные заказа",
      fieldErrors,
      step: errorStep(fieldErrors),
    };
  }

  const customerName = text(input.customerName);
  const phone = text(input.phone);
  const comment = text(input.comment);
  const address =
    input.deliveryMethod === "pickup"
      ? pickupAddress
      : [
          text(input.city),
          text(input.street),
          text(input.house),
          text(input.flat) ? `кв. ${text(input.flat)}` : "",
        ]
          .filter(Boolean)
          .join(", ");

  try {
    return await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({
        where: { id: { in: items.map((item) => item.productId) } },
        select: { id: true, name: true, price: true, quantity: true },
      });
      const productById = new Map(
        products.map((product) => [product.id, product]),
      );

      for (const item of items) {
        const product = productById.get(item.productId);

        if (!product) {
          return {
            ok: false,
            error: "Некоторые товары больше недоступны",
            fieldErrors: {
              items: "Удалите недоступный товар из корзины и попробуйте снова",
            },
            step: 3,
          };
        }

        if (product.quantity <= 0) {
          return {
            ok: false,
            error: `Товар «${product.name}» закончился`,
            fieldErrors: {
              items: `Товара «${product.name}» нет в наличии. Уберите его из корзины.`,
            },
            step: 3,
          };
        }

        if (item.qty > product.quantity) {
          return {
            ok: false,
            error: `Недостаточно остатка товара «${product.name}»`,
            fieldErrors: {
              items: `В наличии только ${product.quantity} шт. товара «${product.name}». Уменьшите количество.`,
            },
            step: 3,
          };
        }
      }

      for (const item of items) {
        const updated = await tx.product.updateMany({
          where: {
            id: item.productId,
            quantity: { gte: item.qty },
          },
          data: { quantity: { decrement: item.qty } },
        });

        if (updated.count === 0) {
          throw new Error(
            "Остаток товара изменился. Обновите корзину и попробуйте снова.",
          );
        }
      }

      const now = new Date();
      const number = await nextOrderNumber(tx, now);

      const order = await tx.order.create({
        data: {
          number,
          customerName,
          phone,
          address,
          deliveryMethod: input.deliveryMethod,
          comment: comment || null,
          payment: paymentLabels[input.payment],
          status: "new",
          createdAt: now,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.qty,
              price: productById.get(item.productId)!.price,
            })),
          },
        },
      });

      return { ok: true, orderId: order.id, number: order.number };
    });
  } catch (error) {
    console.error("Не удалось создать заказ", error);

    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Не удалось создать заказ. Попробуйте ещё раз.",
      step: 3,
    };
  }
}
