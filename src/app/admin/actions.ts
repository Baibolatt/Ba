"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import {
  ADMIN_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE,
  createAdminSessionToken,
  hasAdminPassword,
  isAdminAuthenticated,
  isValidAdminPassword,
} from "@/lib/admin-auth";
import { changeOrderStatus } from "@/lib/orders";
import {
  deleteProduct,
  saveProduct,
} from "@/lib/product-admin";
import {
  deleteProductImage,
  saveProductImage,
} from "@/lib/product-image";
import {
  checkRateLimit,
  clientAddress,
  tooManyAttemptsMessage,
} from "@/lib/rate-limit";
import type { OrderStatus } from "@/lib/types";

export type AdminActionState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export type AdminLoginState = {
  error?: string;
};

const orderStatuses: OrderStatus[] = [
  "new",
  "in_progress",
  "done",
  "cancelled",
];

function isOrderStatus(value: string): value is OrderStatus {
  return orderStatuses.some((status) => status === value);
}

export async function loginAdminAction(
  _previous: AdminLoginState,
  formData: FormData,
): Promise<AdminLoginState> {
  if (!hasAdminPassword()) {
    return { error: "ADMIN_PASSWORD не задан в .env" };
  }

  const limit = checkRateLimit(
    `admin-login:${await clientAddress()}`,
    10,
    15 * 60 * 1000,
  );
  if (!limit.allowed) {
    return { error: tooManyAttemptsMessage(limit.retryAfterSeconds) };
  }

  const password = String(formData.get("password") ?? "");

  if (!isValidAdminPassword(password)) {
    return { error: "Неверный пароль" };
  }

  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, createAdminSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });

  redirect("/admin");
}

export async function logoutAdminAction(): Promise<void> {
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
    maxAge: 0,
  });

  redirect("/admin/login");
}

export async function updateOrderStatusAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const orderId = String(formData.get("orderId") ?? "").trim();
  const status = String(formData.get("status") ?? "");

  if (!orderId || !isOrderStatus(status)) {
    return { status: "error", message: "Некорректный статус заказа" };
  }

  const result = await changeOrderStatus(orderId, status);

  if (!result.ok) {
    return { status: "error", message: result.error };
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin");

  return { status: "success", message: result.message };
}

export async function updateProductAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const productId = String(formData.get("productId") ?? "").trim();
  const price = Number(String(formData.get("price") ?? "").trim());
  const quantity = Number(String(formData.get("quantity") ?? "").trim());

  if (!productId) {
    return { status: "error", message: "Товар не найден" };
  }

  if (!Number.isInteger(price) || price < 0 || price > 100_000_000) {
    return {
      status: "error",
      message: "Цена должна быть целым неотрицательным числом",
    };
  }

  if (!Number.isInteger(quantity) || quantity < 0 || quantity > 1_000_000) {
    return {
      status: "error",
      message: "Остаток должен быть целым неотрицательным числом",
    };
  }

  const updated = await prisma.product.updateMany({
    where: { id: productId },
    data: { price, quantity },
  });

  if (updated.count === 0) {
    return { status: "error", message: "Товар не найден" };
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin");

  return { status: "success", message: "Цена и остаток обновлены" };
}

export async function saveProductAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const productId = String(formData.get("productId") ?? "").trim();

  const result = await saveProduct(
    {
      article: formData.get("article"),
      name: formData.get("name"),
      brandName: formData.get("brandName"),
      categoryName: formData.get("categoryName"),
      price: formData.get("price"),
      oldPrice: formData.get("oldPrice"),
      quantity: formData.get("quantity"),
      unit: formData.get("unit"),
      description: formData.get("description"),
      compatibility: formData.get("compatibility"),
      badge: formData.get("badge"),
    },
    productId || undefined,
  );

  if (!result.ok) {
    return { status: "error", message: result.error };
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin");

  if (result.created) {
    redirect(`/admin/products/${result.id}?created=1`);
  }

  return { status: "success", message: result.message };
}

export async function deleteProductAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const productId = String(formData.get("productId") ?? "").trim();
  if (!productId) {
    return { status: "error", message: "Товар не найден" };
  }

  const result = await deleteProduct(productId);
  if (!result.ok) {
    return { status: "error", message: result.error };
  }

  revalidatePath("/", "layout");
  revalidatePath("/admin");

  redirect("/admin");
}

export async function uploadProductImageAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const productId = String(formData.get("productId") ?? "").trim();
  const file = formData.get("image");

  if (!productId) {
    return { status: "error", message: "Товар не найден" };
  }

  if (!(file instanceof File)) {
    return { status: "error", message: "Выберите файл изображения" };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { imageUrl: true },
  });

  if (!product) {
    return { status: "error", message: "Товар не найден" };
  }

  const saved = await saveProductImage(file);
  if (!saved.ok) {
    return { status: "error", message: saved.error };
  }

  const updated = await prisma.product.updateMany({
    where: { id: productId },
    data: { imageUrl: saved.url },
  });

  if (updated.count === 0) {
    await deleteProductImage(saved.url);
    return { status: "error", message: "Товар не найден" };
  }

  await deleteProductImage(product.imageUrl);

  revalidatePath("/", "layout");
  revalidatePath("/admin");

  return { status: "success", message: "Фото загружено" };
}

export async function removeProductImageAction(
  _previous: AdminActionState,
  formData: FormData,
): Promise<AdminActionState> {
  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }

  const productId = String(formData.get("productId") ?? "").trim();

  if (!productId) {
    return { status: "error", message: "Товар не найден" };
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { imageUrl: true },
  });

  if (!product) {
    return { status: "error", message: "Товар не найден" };
  }

  const updated = await prisma.product.updateMany({
    where: { id: productId },
    data: { imageUrl: null },
  });

  if (updated.count === 0) {
    return { status: "error", message: "Товар не найден" };
  }

  await deleteProductImage(product.imageUrl);

  revalidatePath("/", "layout");
  revalidatePath("/admin");

  return { status: "success", message: "Фото удалено" };
}
