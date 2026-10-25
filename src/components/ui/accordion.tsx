"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/icon";

export type AccordionItem = {
  title: string;
  content: ReactNode;
};

type AccordionProps = {
  items: AccordionItem[];
  defaultOpen?: number | null;
};

export function Accordion({ items, defaultOpen = 0 }: AccordionProps) {
  const [open, setOpen] = useState<number | null>(defaultOpen);

  return (
    <div className="divide-y divide-line overflow-hidden rounded-card border border-line bg-surface">
      {items.map((item, index) => {
        const isOpen = open === index;
        return (
          <div key={item.title}>
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : index)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-semibold text-ink transition-colors hover:bg-brand-50/60 sm:px-5"
            >
              {item.title}
              <Icon
                name={isOpen ? "minus" : "plus"}
                className="size-4 shrink-0 text-icon"
                strokeWidth={2}
              />
            </button>
            {isOpen ? (
              <div className="px-4 pb-4 text-sm leading-relaxed text-muted sm:px-5">
                {item.content}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
