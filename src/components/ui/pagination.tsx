import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";

type PaginationProps = {
  page: number;
  pages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, pages, onPageChange }: PaginationProps) {
  if (pages <= 1) return null;

  const numbers = Array.from({ length: pages }, (_, index) => index + 1);

  return (
    <nav
      aria-label="Пагинация"
      className="flex items-center justify-center gap-2 pt-2"
    >
      <button
        type="button"
        onClick={() => onPageChange(page - 1)}
        disabled={page === 1}
        aria-label="Предыдущая страница"
        className="flex size-10 items-center justify-center rounded-control border border-line bg-surface text-ink transition-colors hover:bg-brand-50 disabled:pointer-events-none disabled:opacity-40"
      >
        <Icon name="chevronLeft" className="size-4" />
      </button>
      {numbers.map((number) => (
        <button
          key={number}
          type="button"
          onClick={() => onPageChange(number)}
          aria-current={number === page ? "page" : undefined}
          className={cn(
            "size-10 rounded-control border text-sm font-semibold transition-colors",
            number === page
              ? "border-brand bg-brand text-white"
              : "border-line bg-surface text-ink hover:bg-brand-50",
          )}
        >
          {number}
        </button>
      ))}
      <button
        type="button"
        onClick={() => onPageChange(page + 1)}
        disabled={page === pages}
        aria-label="Следующая страница"
        className="flex size-10 items-center justify-center rounded-control border border-line bg-surface text-ink transition-colors hover:bg-brand-50 disabled:pointer-events-none disabled:opacity-40"
      >
        <Icon name="chevronRight" className="size-4" />
      </button>
    </nav>
  );
}
