import Link from "next/link";
import { brands } from "@/lib/mock-data";

export function BrandStrip() {
  return (
    <div className="flex flex-wrap gap-2">
      {brands.map((brand) => (
        <Link
          key={brand}
          href={`/search?q=${encodeURIComponent(brand)}`}
          className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-brand transition-colors hover:border-accent hover:bg-accent-soft/40"
        >
          {brand}
        </Link>
      ))}
    </div>
  );
}
