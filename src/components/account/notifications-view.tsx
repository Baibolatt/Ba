"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import type { NotificationItem } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Icon, type IconName } from "@/components/ui/icon";

function notificationIcon(item: NotificationItem): IconName {
  if (item.title.startsWith("Заказ")) return "box";
  if (item.href?.startsWith("/product")) return "box";
  return "bell";
}

export function NotificationsView({
  initialItems,
}: {
  initialItems: NotificationItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const unread = items.filter((item) => !item.read).length;

  const markAllRead = () => {
    setItems((current) =>
      current.map((item) => ({ ...item, read: true })),
    );
  };

  const markRead = (id: string) => {
    setItems((current) =>
      current.map((item) =>
        item.id === id ? { ...item, read: true } : item,
      ),
    );
  };

  if (items.length === 0) {
    return (
      <EmptyState
        icon="bell"
        title="Уведомлений нет"
        description="Здесь появятся события по заказам и наличию товаров."
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted">
          Непрочитанных:{" "}
          <span className="font-semibold text-ink">{unread}</span>
        </p>
        <Button
          variant="secondary"
          size="sm"
          onClick={markAllRead}
          disabled={unread === 0}
        >
          <Icon name="check" className="size-4" />
          Отметить все прочитанными
        </Button>
      </div>

      <div className="mt-3 space-y-2.5">
        {items.map((item) => {
          const content = (
            <>
              <span
                className={cn(
                  "flex size-10 shrink-0 items-center justify-center rounded-control",
                  item.read
                    ? "bg-page text-muted"
                    : "bg-tint text-brand",
                )}
              >
                <Icon name={notificationIcon(item)} className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-3">
                  <span className="text-sm font-semibold text-ink">
                    {item.title}
                  </span>
                  {!item.read ? (
                    <span
                      className="mt-1 size-2 shrink-0 rounded-full bg-brand"
                      aria-label="Непрочитанное"
                    />
                  ) : null}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted">
                  {item.text}
                </span>
                <span className="mt-1.5 block text-[11px] text-muted/80">
                  {item.date}
                </span>
              </span>
            </>
          );

          const classes = cn(
            "flex w-full items-start gap-3 rounded-card border p-3.5 text-left transition-colors",
            item.read
              ? "border-line bg-surface"
              : "border-brand/25 bg-brand-50/60",
            item.href ? "hover:border-brand/30 hover:bg-brand-50/40" : "",
          );

          if (item.href) {
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => markRead(item.id)}
                className={classes}
              >
                {content}
                <Icon
                  name="chevronRight"
                  className="mt-2.5 size-4 shrink-0 text-line-strong"
                />
              </Link>
            );
          }

          return (
            <div key={item.id} className={classes}>
              {content}
            </div>
          );
        })}
      </div>
    </div>
  );
}
