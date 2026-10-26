import { readFile } from "node:fs/promises";
import { productImagePath } from "@/lib/product-image";

type ProductImageRouteProps = {
  params: Promise<{ filename: string }>;
};

export async function GET(
  _request: Request,
  { params }: ProductImageRouteProps,
) {
  const { filename } = await params;
  const file = productImagePath(filename);

  if (!file) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const data = await readFile(file.path);

    return new Response(new Uint8Array(data), {
      headers: {
        "Content-Type": file.contentType,
        "Content-Length": String(data.byteLength),
        // Имя содержит UUID и не меняется для одного файла.
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
