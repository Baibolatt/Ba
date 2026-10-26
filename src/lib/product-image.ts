import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export const MAX_PRODUCT_IMAGE_BYTES = 5 * 1024 * 1024;
export const PRODUCT_IMAGE_URL_PREFIX = "/uploads/products/";

const PRODUCT_IMAGE_DIR = path.join(
  process.cwd(),
  "storage",
  "products",
);

const contentTypes = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
} as const;

const filenamePattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

export function productImagePath(
  filename: string,
): { path: string; contentType: string } | null {
  if (!filenamePattern.test(filename)) return null;

  const extension = filename.slice(filename.lastIndexOf(".") + 1) as
    | "jpg"
    | "png"
    | "webp";

  return {
    path: path.join(PRODUCT_IMAGE_DIR, filename),
    contentType: contentTypes[extension],
  };
}

type ImageFormat = {
  extension: "jpg" | "png" | "webp";
  matches: (bytes: Uint8Array) => boolean;
};

const formats: ImageFormat[] = [
  {
    extension: "jpg",
    matches: (bytes) =>
      bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  {
    extension: "png",
    matches: (bytes) =>
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a,
  },
  {
    extension: "webp",
    matches: (bytes) =>
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50,
  },
];

export type SaveProductImageResult =
  | { ok: true; url: string }
  | { ok: false; error: string };

export async function saveProductImage(
  file: File,
): Promise<SaveProductImageResult> {
  if (file.size <= 0) {
    return { ok: false, error: "Выберите файл изображения" };
  }

  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    return { ok: false, error: "Файл больше 5 МБ" };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const format = formats.find((item) => item.matches(buffer));

  if (!format) {
    return {
      ok: false,
      error: "Поддерживаются изображения JPG, PNG и WebP",
    };
  }

  const filename = `${randomUUID()}.${format.extension}`;

  try {
    await mkdir(PRODUCT_IMAGE_DIR, { recursive: true });
    await writeFile(path.join(PRODUCT_IMAGE_DIR, filename), buffer);
  } catch (error) {
    console.error("Не удалось сохранить фото товара", error);
    return { ok: false, error: "Не удалось сохранить файл" };
  }

  return { ok: true, url: `${PRODUCT_IMAGE_URL_PREFIX}${filename}` };
}

export async function deleteProductImage(
  url: string | null | undefined,
): Promise<void> {
  if (!url?.startsWith(PRODUCT_IMAGE_URL_PREFIX)) return;

  const file = productImagePath(
    url.slice(PRODUCT_IMAGE_URL_PREFIX.length),
  );
  if (!file) return;

  try {
    await unlink(file.path);
  } catch (error) {
    // Файла может уже не быть — для очистки это не ошибка.
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      console.error("Не удалось удалить фото товара", error);
    }
  }
}
