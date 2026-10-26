/**
 * Приводит телефон к каноническому виду +77001234567.
 * Локальный номер из 10 цифр считается казахстанским;
 * номер с ведущей 8 переводится в код +7.
 */
export function normalizePhone(value: string): string | null {
  const digits = value.replace(/\D/g, "");
  if (!digits) return null;

  let normalized = digits;

  if (digits.length === 10) {
    normalized = `7${digits}`;
  } else if (digits.length === 11 && digits.startsWith("8")) {
    normalized = `7${digits.slice(1)}`;
  }

  if (normalized.length < 11 || normalized.length > 15) return null;

  return `+${normalized}`;
}

/** Человекочитаемый вид казахстанского номера, остальные — как есть. */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 11 && digits.startsWith("7")) {
    return `+7 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7, 9)}-${digits.slice(9, 11)}`;
  }

  return value;
}
