"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { normalizePhone } from "@/lib/phone";
import {
  checkRateLimit,
  clientAddress,
  tooManyAttemptsMessage,
} from "@/lib/rate-limit";
import {
  clearSessionCookie,
  getCurrentUser,
  hashPassword,
  setSessionCookie,
  verifyPassword,
} from "@/lib/auth";

export type AuthActionState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export type ProfileActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Record<string, string>;
};

// Хеш-заглушка: проверка пароля выполняется всегда, чтобы по времени ответа
// нельзя было определить, зарегистрирован ли номер.
const DUMMY_PASSWORD_HASH = `scrypt$${"00".repeat(16)}$${"00".repeat(64)}`;

const PHONE_ERROR = "Укажите телефон в формате +7 (700) 000-00-00";

function text(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim() : "";
}

export async function loginAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const phone = normalizePhone(text(formData.get("phone")));
  const password = text(formData.get("password"));
  const remember = formData.get("remember") !== null;

  if (!phone || !password) {
    const fieldErrors: Record<string, string> = {};
    if (!phone) fieldErrors.phone = PHONE_ERROR;
    if (!password) fieldErrors.password = "Введите пароль";

    return { error: "Проверьте данные входа", fieldErrors };
  }

  const address = await clientAddress();
  const limit = checkRateLimit(
    `login:${address}:${phone}`,
    10,
    15 * 60 * 1000,
  );
  if (!limit.allowed) {
    return { error: tooManyAttemptsMessage(limit.retryAfterSeconds) };
  }

  const user = await prisma.user.findUnique({
    where: { phone },
    select: { id: true, passwordHash: true },
  });

  const passwordOk = await verifyPassword(
    password,
    user?.passwordHash ?? DUMMY_PASSWORD_HASH,
  );

  if (!user || !passwordOk) {
    return { error: "Неверный номер телефона или пароль" };
  }

  if (!(await setSessionCookie(user.id, remember))) {
    return {
      error: "Не настроен SESSION_SECRET. Задайте переменную в .env и перезапустите сервер.",
    };
  }

  redirect("/account");
}

export async function registerAction(
  _previous: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const name = text(formData.get("name"));
  const phone = normalizePhone(text(formData.get("phone")));
  const password = text(formData.get("password"));
  const confirm = text(formData.get("confirm"));
  const consent = formData.get("consent") !== null;

  const address = await clientAddress();
  const limit = checkRateLimit(`register:${address}`, 5, 60 * 60 * 1000);
  if (!limit.allowed) {
    return { error: tooManyAttemptsMessage(limit.retryAfterSeconds) };
  }

  const fieldErrors: Record<string, string> = {};

  if (!name) {
    fieldErrors.name = "Укажите имя";
  } else if (name.length > 120) {
    fieldErrors.name = "Имя слишком длинное";
  }

  if (!phone) {
    fieldErrors.phone = PHONE_ERROR;
  }

  if (password.length < 8) {
    fieldErrors.password = "Минимум 8 символов";
  } else if (password.length > 200) {
    fieldErrors.password = "Пароль слишком длинный";
  }

  if (confirm !== password) {
    fieldErrors.confirm = "Пароли не совпадают";
  }

  if (!consent) {
    fieldErrors.consent = "Нужно согласие на обработку данных";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { error: "Проверьте данные регистрации", fieldErrors };
  }

  if (!phone) {
    return {
      error: "Проверьте данные регистрации",
      fieldErrors: { phone: PHONE_ERROR },
    };
  }

  const existing = await prisma.user.findUnique({
    where: { phone },
    select: { id: true },
  });

  if (existing) {
    return {
      error: "Номер уже зарегистрирован",
      fieldErrors: { phone: "Этот номер уже зарегистрирован" },
    };
  }

  const passwordHash = await hashPassword(password);

  let user: { id: string };
  try {
    user = await prisma.user.create({
      data: { name, phone, passwordHash },
      select: { id: true },
    });
  } catch (error) {
    // Гонка двух одновременных регистраций на один номер.
    if ((error as { code?: string }).code === "P2002") {
      return {
        error: "Номер уже зарегистрирован",
        fieldErrors: { phone: "Этот номер уже зарегистрирован" },
      };
    }

    throw error;
  }

  if (!(await setSessionCookie(user.id, true))) {
    return {
      error: "Не настроен SESSION_SECRET. Задайте переменную в .env и перезапустите сервер.",
    };
  }

  redirect("/account");
}

export async function logoutAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/");
}

export async function updateProfileAction(
  _previous: ProfileActionState,
  formData: FormData,
): Promise<ProfileActionState> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const name = text(formData.get("name"));
  const phone = normalizePhone(text(formData.get("phone")));
  const city = text(formData.get("city"));
  const address = text(formData.get("address"));

  const fieldErrors: Record<string, string> = {};

  if (!name) {
    fieldErrors.name = "Укажите имя";
  } else if (name.length > 120) {
    fieldErrors.name = "Имя слишком длинное";
  }

  if (!phone) {
    fieldErrors.phone = PHONE_ERROR;
  }

  if (city.length > 120) fieldErrors.city = "Название города слишком длинное";
  if (address.length > 200) fieldErrors.address = "Адрес слишком длинный";

  if (phone) {
    const duplicate = await prisma.user.findFirst({
      where: { phone, NOT: { id: user.id } },
      select: { id: true },
    });

    if (duplicate) {
      fieldErrors.phone = "Этот номер уже зарегистрирован";
    }
  }

  if (Object.keys(fieldErrors).length > 0 || !phone) {
    return {
      status: "error",
      message: "Проверьте данные профиля",
      fieldErrors,
    };
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { name, phone, city, address },
    });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") {
      return {
        status: "error",
        message: "Этот номер уже зарегистрирован",
        fieldErrors: { phone: "Этот номер уже зарегистрирован" },
      };
    }

    throw error;
  }

  revalidatePath("/account", "layout");

  return { status: "success", message: "Данные сохранены" };
}
