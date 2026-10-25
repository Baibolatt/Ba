"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

const carMarks = [
  "Любая марка",
  "Audi",
  "BMW",
  "Ford",
  "Hyundai",
  "Kia",
  "Lada",
  "Renault",
  "Skoda",
  "Toyota",
  "Volkswagen",
];

const carModels = [
  "Любая модель",
  "Camry",
  "Corolla",
  "Rio",
  "Sportage",
  "Focus",
  "Octavia",
  "Vesta",
  "Duster",
];

const years = [
  "Любой год",
  ...Array.from({ length: 12 }, (_, index) => String(2026 - index)),
];

const selectClass =
  "h-10 w-full cursor-pointer appearance-none rounded-control border border-line-strong bg-surface px-3 pr-8 text-sm text-ink focus:border-brand focus:outline-none focus:ring-2 focus:ring-accent/25";

export function CarSelector() {
  const router = useRouter();
  const [mark, setMark] = useState(carMarks[0]);
  const [model, setModel] = useState(carModels[0]);
  const [year, setYear] = useState(years[0]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (mark !== carMarks[0]) params.set("mark", mark);
    if (model !== carModels[0]) params.set("model", model);
    if (year !== years[0]) params.set("year", year);
    const query = params.toString();
    router.push(query ? `/catalog/all?${query}` : "/catalog/all");
  };

  return (
    <div className="rounded-card border border-line bg-surface p-3 shadow-card sm:p-4">
      <div className="mb-2.5 flex items-center gap-2 text-sm font-semibold text-ink">
        <Icon name="car" className="size-4 text-accent" />
        Подбор по автомобилю
      </div>
      <form
        onSubmit={onSubmit}
        className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_0.8fr_auto]"
      >
        <label className="relative">
          <span className="sr-only">Марка</span>
          <select
            value={mark}
            onChange={(event) => setMark(event.target.value)}
            className={selectClass}
          >
            {carMarks.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <Icon
            name="chevronDown"
            className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted"
          />
        </label>

        <label className="relative">
          <span className="sr-only">Модель</span>
          <select
            value={model}
            onChange={(event) => setModel(event.target.value)}
            className={selectClass}
          >
            {carModels.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <Icon
            name="chevronDown"
            className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted"
          />
        </label>

        <label className="relative">
          <span className="sr-only">Год</span>
          <select
            value={year}
            onChange={(event) => setYear(event.target.value)}
            className={selectClass}
          >
            {years.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <Icon
            name="chevronDown"
            className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted"
          />
        </label>

        <Button
          type="submit"
          variant="accent"
          className="col-span-2 sm:col-span-1"
        >
          Подобрать
        </Button>
      </form>
    </div>
  );
}
