import { headers } from "next/headers";

type Bucket = {
  count: number;
  resetAt: number;
};

// Счётчики живут в памяти процесса: они защищают от простого перебора,
// но сбрасываются при перезапуске и не общие для нескольких инстансов.
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5_000;

export type RateLimitResult =
  | { allowed: true }
  | { allowed: false; retryAfterSeconds: number };

function prune(now: number): void {
  if (buckets.size <= MAX_BUCKETS) return;

  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }

  // Если все счётчики ещё активны, вытесняем самые старые: иначе карта
  // растёт без предела при переборе с множества адресов.
  for (const key of buckets.keys()) {
    if (buckets.size <= MAX_BUCKETS) break;
    buckets.delete(key);
  }
}

export function checkRateLimit(
  key: string,
  limit: number,
  windowMs: number,
  now = Date.now(),
): RateLimitResult {
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    prune(now);
    return { allowed: true };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((bucket.resetAt - now) / 1000),
      ),
    };
  }

  bucket.count += 1;
  return { allowed: true };
}

/** IP клиента за прокси; в локальной разработке — "local". */
export async function clientAddress(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  const ip =
    forwarded?.split(",")[0]?.trim() ||
    store.get("x-real-ip")?.trim() ||
    "";

  return ip || "local";
}

export function tooManyAttemptsMessage(retryAfterSeconds: number): string {
  const minutes = Math.max(1, Math.ceil(retryAfterSeconds / 60));

  return `Слишком много попыток. Повторите через ${minutes} мин.`;
}
