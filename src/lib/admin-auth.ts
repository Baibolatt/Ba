import {
  createHash,
  createHmac,
  timingSafeEqual,
} from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

export const ADMIN_COOKIE_NAME = "partshub_admin";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

const SESSION_TTL_MS = ADMIN_SESSION_MAX_AGE * 1000;

function adminPassword(): string {
  return (process.env.ADMIN_PASSWORD ?? "").trim();
}

export function hasAdminPassword(): boolean {
  return adminPassword().length > 0;
}

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function isValidAdminPassword(candidate: string): boolean {
  const expected = adminPassword();
  if (!expected) return false;

  return timingSafeEqual(digest(candidate), digest(expected));
}

function sign(value: string): string {
  return createHmac("sha256", adminPassword())
    .update(`partshub-admin:${value}`)
    .digest("hex");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function createAdminSessionToken(now = Date.now()): string {
  const expiresAt = now + SESSION_TTL_MS;
  return `${expiresAt}.${sign(String(expiresAt))}`;
}

export function isValidAdminSessionToken(value: string): boolean {
  if (!hasAdminPassword()) return false;

  const [expiresAtRaw, signature] = value.split(".");
  const expiresAt = Number(expiresAtRaw);

  if (
    !expiresAtRaw ||
    !signature ||
    !Number.isInteger(expiresAt) ||
    expiresAt <= Date.now()
  ) {
    return false;
  }

  return safeEqual(signature, sign(expiresAtRaw));
}

export async function isAdminAuthenticated(): Promise<boolean> {
  if (!hasAdminPassword()) return false;

  const store = await cookies();
  const token = store.get(ADMIN_COOKIE_NAME)?.value;

  return token ? isValidAdminSessionToken(token) : false;
}

/**
 * Проверка внутри самой страницы, а не только в layout: layout и page
 * рендерятся параллельно, поэтому данные страницы могли попасть в поток
 * до срабатывания redirect из layout.
 */
export async function requireAdmin(): Promise<void> {
  // Явно отмечаем запрос как динамический: проверка подписи использует
  // Date.now(), а при prerender это значение запрещено.
  await connection();

  if (!(await isAdminAuthenticated())) {
    redirect("/admin/login");
  }
}
