import type { Metadata } from "next";
import { ProductForm } from "@/components/admin/product-form";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireAdmin } from "@/lib/admin-auth";
import { getBrands, getCategories } from "@/lib/data";

export const metadata: Metadata = {
  title: "Новый товар",
};

export default async function NewProductPage() {
  await requireAdmin();

  const [brands, categories] = await Promise.all([
    getBrands(),
    getCategories(),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeading
          title="Новый товар"
          description="Заполните карточку вручную. Бренд и категорию можно выбрать из списка или ввести новые."
        />
        <ButtonLink href="/admin" variant="secondary" size="sm">
          Назад в админку
        </ButtonLink>
      </div>

      <ProductForm
        brands={brands}
        categories={categories.map((category) => category.name)}
      />
    </div>
  );
}
