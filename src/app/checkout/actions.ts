"use server";

import { revalidatePath } from "next/cache";
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

  const result = await createOrder(input);

  if (result.ok) {
    revalidatePath("/", "layout");
  }

  return result;
}
