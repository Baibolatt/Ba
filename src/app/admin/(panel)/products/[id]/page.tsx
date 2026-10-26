import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductDeleteForm } from "@/components/admin/product-delete-form";
import { ProductForm } from "@/components/admin/product-form";
import { ProductImageForm } from "@/components/admin/product-image-form";
import { ButtonLink } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/section-heading";
import { requireAdmin } from "@/lib/admin-auth";
import { getBrands, getCategories, getProduct } from "@/lib/data";

type EditProductPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string | string[] }>;
};

export async function generateMetadata({
  params,
}: EditProductPageProps): Promise<Metadata> {
  await requireAdmin();

  const { id } = await params;
  const product = await getProduct(id);

  return { title: product ? product.name : "Товар не найден" };
}

export default async function EditProductPage({
  params,
  searchParams,
}: EditProductPageProps) {
  await requireAdmin();

  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();

  const [brands, categories, query] = await Promise.all([
    getBrands(),
    getCategories(),
    searchParams,
  ]);

  const created = query.created === "1";

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <SectionHeading
          title={product.name}
          description={`${product.article} · ${product.brand} · ${product.categoryName}`}
        />
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={`/product/${product.id}`} variant="secondary" size="sm">
            Открыть на сайте
          </ButtonLink>
          <ButtonLink href="/admin/products" variant="secondary" size="sm">
            К товарам
          </ButtonLink>
        </div>
      </div>

      {created ? (
        <p
          role="status"
          className="rounded-card border border-brand/30 bg-brand-50 p-3 text-sm font-medium text-brand"
        >
          Товар создан. Теперь можно загрузить фото и проверить карточку на
          сайте.
        </p>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <ProductForm
          product={product}
          brands={brands}
          categories={categories.map((category) => category.name)}
        />

        <div className="space-y-4">
          <section className="rounded-card border border-line bg-surface p-4 shadow-card">
            <h2 className="text-sm font-bold text-ink">Фото товара</h2>
            <p className="mt-1 text-xs text-muted">
              Одно фото: JPG, PNG или WebP до 5 МБ.
            </p>
            <div className="mt-3">
              <ProductImageForm product={product} />
            </div>
          </section>

          <section className="rounded-card border border-line bg-surface p-4 shadow-card">
            <h2 className="text-sm font-bold text-ink">Удаление</h2>
            <p className="mt-1 text-xs text-muted">
              Товар из заказов удалить нельзя — можно обнулить остаток.
            </p>
            <div className="mt-3">
              <ProductDeleteForm
                productId={product.id}
                productName={product.name}
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
