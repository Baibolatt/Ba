import {
  createHmac,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";

const scrypt = promisify(scryptCallback);

export const SESSION_COOKIE_NAME = "partshub_session";

const SHORT_SESSION_SECONDS = 60 * 60 * 24;
const LONG_SESSION_SECONDS = 60 * 60 * 24 * 30;

export type CurrentUser = {
  id: string;
  name: string;
  email: string | null;
  phone: string;
  city: string;
  address: string;
};

export function sessionMaxAge(remember: boolean): number {
  return remember ? LONG_SESSION_SECONDS : SHORT_SESSION_SECONDS;
}

/**
 * Ключ для подписи сессионных cookie. Отдельный SESSION_SECRET предпочтителен;
 * если он не задан, используется ADMIN_PASSWORD, чтобы вход работал в разработке.
 */
function sessionSecret(): string | null {
  const value = (
    process.env.SESSION_SECRET ??
    process.env.ADMIN_PASSWORD ??
    ""
  ).trim();

  return value.length > 0 ? value : null;
}

export function hasSessionSecret(): boolean {
  return sessionSecret() !== null;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = (await scrypt(password, salt, 64)) as Buffer;

  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(hashHex, "hex");
  if (salt.length === 0 || expected.length === 0) return false;

  const actual = (await scrypt(password, salt, expected.length)) as Buffer;

  return (
    actual.length === expected.length && timingSafeEqual(actual, expected)
  );
}

function signSession(
  userId: string,
  expiresAt: number,
  secret: string,
): string {
  return createHmac("sha256", secret)
    .update(`partshub-session:${userId}:${expiresAt}`)
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

export function createSessionToken(
  userId: string,
  remember: boolean,
  now = Date.now(),
): string | null {
  const secret = sessionSecret();
  if (!secret) return null;

  const expiresAt = now + sessionMaxAge(remember) * 1000;

  return `${userId}.${expiresAt}.${signSession(userId, expiresAt, secret)}`;
}

export function readSessionUserId(
  token: string,
  now = Date.now(),
): string | null {
  const secret = sessionSecret();
  if (!secret) return null;

  const parts = token.split(".");
  if (parts.length !== 3) return null;

  const [userId, expiresAtRaw, signature] = parts;
  const expiresAt = Number(expiresAtRaw);

  if (
    !userId ||
    !signature ||
    !Number.isInteger(expiresAt) ||
    expiresAt <= now
  ) {
    return null;
  }

  return safeEqual(signature, signSession(userId, expiresAt, secret))
    ? userId
    : null;
}

export async function setSessionCookie(
  userId: string,
  remember: boolean,
): Promise<boolean> {
  const token = createSessionToken(userId, remember);
  if (!token) return false;

  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAge(remember),
  });

  return true;
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

/** Текущий клиент или null. Кэшируется в пределах одного запроса. */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const userId = readSessionUserId(token);
  if (!userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      city: true,
      address: true,
    },
  });

  return user;
});

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return user;
}
