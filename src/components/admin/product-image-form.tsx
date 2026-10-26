"use client";

import { useActionState } from "react";
import {
  removeProductImageAction,
  uploadProductImageAction,
  type AdminActionState,
} from "@/app/admin/actions";
import { Button } from "@/components/ui/button";
import { ProductImage } from "@/components/catalog/product-image";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/types";

const initialState: AdminActionState = { status: "idle" };

export function ProductImageForm({ product }: { product: Product }) {
  const [uploadState, uploadAction, uploading] = useActionState(
    uploadProductImageAction,
    initialState,
  );
  const [removeState, removeAction, removing] = useActionState(
    removeProductImageAction,
    initialState,
  );

  return (
    <div className="flex flex-wrap items-start gap-3">
      <ProductImage product={product} className="size-14 shrink-0" />

      <div className="min-w-0 flex-1 space-y-2">
        <form action={uploadAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="productId" value={product.id} />
          <input
            type="file"
            name="image"
            accept="image/jpeg,image/png,image/webp"
            required
            aria-label={`Фото товара ${product.name}`}
            className="block min-w-0 max-w-full text-xs text-muted file:mr-2 file:cursor-pointer file:rounded-control file:border-0 file:bg-brand-50 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-brand hover:file:bg-tint"
          />
          <Button type="submit" size="sm" variant="secondary" disabled={uploading}>
            {uploading
              ? "Загружаем…"
              : product.imageUrl
                ? "Заменить фото"
                : "Загрузить фото"}
          </Button>
        </form>

        {product.imageUrl ? (
          <form action={removeAction}>
            <input type="hidden" name="productId" value={product.id} />
            <button
              type="submit"
              disabled={removing}
              className="text-xs font-medium text-muted underline-offset-2 transition-colors hover:text-danger hover:underline disabled:opacity-50"
            >
              {removing ? "Удаляем…" : "Удалить фото"}
            </button>
          </form>
        ) : null}

        <p className="text-[11px] text-muted">
          JPG, PNG или WebP до 5 МБ
        </p>

        {uploadState.message ? (
          <p
            role={uploadState.status === "error" ? "alert" : "status"}
            className={cn(
              "text-xs font-medium",
              uploadState.status === "error" ? "text-danger" : "text-brand",
            )}
          >
            {uploadState.message}
          </p>
        ) : null}

        {removeState.message ? (
          <p
            role={removeState.status === "error" ? "alert" : "status"}
            className={cn(
              "text-xs font-medium",
              removeState.status === "error" ? "text-danger" : "text-brand",
            )}
          >
            {removeState.message}
          </p>
        ) : null}
      </div>
    </div>
  );
}
