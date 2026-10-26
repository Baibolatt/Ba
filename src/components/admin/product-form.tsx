"use client";

import { useActionState } from "react";
import {
  saveProductAction,
  type AdminActionState,
} from "@/app/admin/actions";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  SelectField,
  TextareaField,
  TextField,
} from "@/components/ui/form-fields";
import { cn } from "@/lib/cn";
import type { Product } from "@/lib/types";

const initialState: AdminActionState = { status: "idle" };

type ProductFormProps = {
  product?: Product;
  brands: string[];
  categories: string[];
};

export function ProductForm({
  product,
  brands,
  categories,
}: ProductFormProps) {
  const [state, formAction, pending] = useActionState(
    saveProductAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-card border border-line bg-surface p-4 shadow-card sm:p-5"
    >
      {product ? (
        <input type="hidden" name="productId" value={product.id} />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Артикул"
          name="article"
          required
          maxLength={60}
          defaultValue={product?.article}
          placeholder="TL-2418"
          hint="Должен быть уникальным"
        />
        <TextField
          label="Название"
          name="name"
          required
          maxLength={200}
          defaultValue={product?.name}
          placeholder="Тормозная колодка передняя"
        />
        <TextField
          label="Бренд"
          name="brandName"
          required
          maxLength={100}
          list="product-brand-options"
          defaultValue={product?.brand}
          placeholder="Bosch"
          hint="Можно ввести новый бренд"
        />
        <TextField
          label="Категория"
          name="categoryName"
          required
          maxLength={100}
          list="product-category-options"
          defaultValue={product?.categoryName}
          placeholder="Тормозная система"
          hint="Можно ввести новую категорию"
        />
        <TextField
          label="Цена, ₸"
          name="price"
          type="number"
          min={0}
          max={100_000_000}
          step={1}
          required
          inputMode="numeric"
          defaultValue={product?.price}
        />
        <TextField
          label="Старая цена, ₸"
          name="oldPrice"
          type="number"
          min={0}
          max={100_000_000}
          step={1}
          inputMode="numeric"
          defaultValue={product?.oldPrice}
          hint="Необязательно; показывается зачёркнутой"
        />
        <TextField
          label="Остаток, шт."
          name="quantity"
          type="number"
          min={0}
          max={1_000_000}
          step={1}
          required
          inputMode="numeric"
          defaultValue={product?.quantity ?? 0}
        />
        <TextField
          label="Единица"
          name="unit"
          maxLength={20}
          defaultValue={product?.unit ?? "шт."}
        />
        <SelectField
          label="Метка"
          name="badge"
          defaultValue={product?.badge ?? ""}
          options={[
            { value: "", label: "Без метки" },
            { value: "Хит", label: "Хит" },
            { value: "Новинка", label: "Новинка" },
          ]}
        />
      </div>

      <datalist id="product-brand-options">
        {brands.map((brand) => (
          <option key={brand} value={brand} />
        ))}
      </datalist>
      <datalist id="product-category-options">
        {categories.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>

      <TextareaField
        label="Совместимость"
        name="compatibility"
        maxLength={500}
        rows={2}
        defaultValue={product?.compatibility}
        placeholder="Toyota Camry 2011–2017, Lexus ES"
      />
      <TextareaField
        label="Описание"
        name="description"
        maxLength={5000}
        rows={4}
        defaultValue={product?.description}
        placeholder="Короткое описание товара для карточки"
      />

      {state.message ? (
        <p
          role={state.status === "error" ? "alert" : "status"}
          className={cn(
            "text-sm font-medium",
            state.status === "error" ? "text-danger" : "text-brand",
          )}
        >
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending}>
          {pending
            ? "Сохраняем…"
            : product
              ? "Сохранить изменения"
              : "Создать товар"}
        </Button>
        <ButtonLink href="/admin" variant="secondary">
          Отмена
        </ButtonLink>
      </div>
    </form>
  );
}
