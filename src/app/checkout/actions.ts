"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import {
  checkRateLimit,
  clientAddress,
  tooManyAttemptsMessage,
} from "@/lib/rate-limit";
import {
  createOrder,
  type CreateOrderInput,
  type CreateOrderResult,
} from "@/lib/orders";

export async function createOrderAction(
  input: CreateOrderInput,
): Promise<CreateOrderResult> {
  if (!input || typeof input !== "object") {
    return { ok: false, error: "Некорректные данные заказа", step: 1 };
  }

  const limit = checkRateLimit(
    `order:${await clientAddress()}`,
    10,
    10 * 60 * 1000,
  );
  if (!limit.allowed) {
    return {
      ok: false,
      error: tooManyAttemptsMessage(limit.retryAfterSeconds),
      step: 1,
    };
  }

  // Владелец берётся из сессии, а не из данных формы.
  const user = await getCurrentUser();
  const result = await createOrder(input, user?.id ?? null);

  if (result.ok) {
    revalidatePath("/", "layout");
  }

  return result;
}
