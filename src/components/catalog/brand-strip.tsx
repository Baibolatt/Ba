import Link from "next/link";
import { getBrands } from "@/lib/data";

export async function BrandStrip() {
  const brands = await getBrands();

  return (
    <div className="flex flex-wrap gap-2">
      {brands.map((brand) => (
        <Link
          key={brand}
          href={`/search?q=${encodeURIComponent(brand)}`}
          className="inline-flex min-h-11 items-center rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-brand transition-colors hover:border-brand/40 hover:bg-tint/40"
        >
          {brand}
        </Link>
      ))}
    </div>
  );
}
