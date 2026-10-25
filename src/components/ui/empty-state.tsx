import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/ui/icon";

type EmptyStateProps = {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({
  icon = "box",
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-dashed border-line-strong bg-surface px-6 py-14 text-center">
      <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-brand-50 text-brand">
        <Icon name={icon} className="size-6" />
      </span>
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      {description ? (
        <p className="mt-1.5 max-w-sm text-sm text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
