"use client";

import { useState, type ChangeEvent } from "react";
import { cn } from "@/lib/cn";
import { fieldControlClass } from "@/components/ui/form-fields";
import { Icon } from "@/components/ui/icon";

type PasswordFieldProps = {
  label: string;
  name: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  hint?: string;
  autoComplete?: string;
  required?: boolean;
};

export function PasswordField({
  label,
  name,
  value,
  onChange,
  error,
  hint,
  autoComplete = "current-password",
  required,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="space-y-1.5">
      <label htmlFor={name} className="block text-sm font-medium text-ink">
        {label}
        {required ? <span className="ml-0.5 text-danger">*</span> : null}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          autoComplete={autoComplete}
          aria-invalid={error ? true : undefined}
          className={cn(
            fieldControlClass(Boolean(error)),
            "h-11 pr-11",
          )}
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? "Скрыть пароль" : "Показать пароль"}
          aria-pressed={visible}
          className="absolute right-1 top-1 flex size-11 items-center justify-center rounded-[8px] text-muted transition-colors hover:bg-brand-50 hover:text-ink"
        >
          <Icon name={visible ? "eyeOff" : "eye"} className="size-4" />
        </button>
      </div>
      {error ? (
        <p className="flex items-start gap-1.5 text-xs font-medium text-brand">
          <Icon name="alertCircle" className="mt-0.5 size-3.5 shrink-0 text-danger" />
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
