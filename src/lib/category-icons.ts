import type { CategoryIcon } from "@/lib/types";

export const categoryIcons: CategoryIcon[] = [
  "brake",
  "filter",
  "droplet",
  "gear",
  "spring",
  "battery",
];

export const categoryIconLabels: Record<CategoryIcon, string> = {
  brake: "Тормоза",
  filter: "Фильтры",
  droplet: "Жидкости",
  gear: "Детали и механизмы",
  spring: "Подвеска",
  battery: "Электрика",
};
