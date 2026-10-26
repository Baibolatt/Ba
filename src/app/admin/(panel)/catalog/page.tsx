import type { Metadata } from "next";
import { BrandManager } from "@/components/admin/brand-manager";
import { CategoryManager } from "@/components/admin/category-manager";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireAdmin } from "@/lib/admin-auth";
import { getBrandSummaries, getCategories } from "@/lib/data";

export const metadata: Metadata = {
  title: "Бренды и категории",
};

export default async function AdminCatalogPage() {
  await requireAdmin();

  const [brands, categories] = await Promise.all([
    getBrandSummaries(),
    getCategories(),
  ]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeading
          title="Бренды и категории"
          description="Справочники каталога. Удалить можно только запись без товаров; slug категории не меняется, чтобы ссылки оставались рабочими."
        />
        <ButtonLink href="/admin" variant="secondary" size="sm">
          Назад в админку
        </ButtonLink>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
          <SectionHeading
            title="Бренды"
            description="Используются в фильтрах и карточках товаров."
          />
          <div className="mt-4">
            <BrandManager brands={brands} />
          </div>
        </section>

        <section className="rounded-card border border-line bg-surface p-4 shadow-card sm:p-5">
          <SectionHeading
            title="Категории"
            description="Порядок задаёт вывод в каталоге и меню."
          />
          <div className="mt-4">
            <CategoryManager categories={categories} />
          </div>
        </section>
      </div>
    </div>
  );
}
