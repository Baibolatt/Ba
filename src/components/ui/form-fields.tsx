import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/cn";
import { Icon } from "@/components/ui/icon";

const controlBase =
  "w-full rounded-control border bg-surface px-3 text-sm text-ink transition-colors placeholder:text-muted/70 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:bg-page disabled:text-muted";

export function fieldControlClass(hasError: boolean): string {
  return cn(
    controlBase,
    hasError
      ? "border-danger focus:border-danger focus:ring-danger/20"
      : "border-line-strong focus:border-brand focus:ring-brand/20",
  );
}

type FieldShellProps = {
  label: string;
  htmlFor: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
};

function FieldShell({
  label,
  htmlFor,
  hint,
  error,
  required,
  children,
  className,
}: FieldShellProps) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-ink">
        {label}
        {required ? <span className="ml-0.5 text-danger">*</span> : null}
      </label>
      {children}
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

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
};

export function TextField({
  label,
  hint,
  error,
  wrapperClassName,
  className,
  id,
  name,
  required,
  ...props
}: TextFieldProps) {
  const fieldId = id ?? name ?? label;
  return (
    <FieldShell
      label={label}
      htmlFor={fieldId}
      hint={hint}
      error={error}
      required={required}
      className={wrapperClassName}
    >
      <input
        id={fieldId}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(fieldControlClass(Boolean(error)), "h-11", className)}
        {...props}
      />
    </FieldShell>
  );
}

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  wrapperClassName?: string;
};

export function SelectField({
  label,
  hint,
  error,
  options,
  wrapperClassName,
  className,
  id,
  name,
  required,
  ...props
}: SelectFieldProps) {
  const fieldId = id ?? name ?? label;
  return (
    <FieldShell
      label={label}
      htmlFor={fieldId}
      hint={hint}
      error={error}
      required={required}
      className={wrapperClassName}
    >
      <select
        id={fieldId}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(fieldControlClass(Boolean(error)), "h-11 pr-8", className)}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FieldShell>
  );
}

type TextareaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
  wrapperClassName?: string;
};

export function TextareaField({
  label,
  hint,
  error,
  wrapperClassName,
  className,
  id,
  name,
  required,
  ...props
}: TextareaFieldProps) {
  const fieldId = id ?? name ?? label;
  return (
    <FieldShell
      label={label}
      htmlFor={fieldId}
      hint={hint}
      error={error}
      required={required}
      className={wrapperClassName}
    >
      <textarea
        id={fieldId}
        name={name}
        required={required}
        aria-invalid={error ? true : undefined}
        className={cn(fieldControlClass(Boolean(error)), "min-h-28 py-2.5", className)}
        {...props}
      />
    </FieldShell>
  );
}

type CheckboxFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: ReactNode;
  error?: string;
};

export function CheckboxField({
  label,
  error,
  className,
  id,
  name,
  ...props
}: CheckboxFieldProps) {
  const fieldId = id ?? name ?? "checkbox";
  return (
    <div className="space-y-1.5">
      <label
        htmlFor={fieldId}
        className="flex min-h-11 cursor-pointer items-start gap-2.5 py-2.5 text-sm text-muted"
      >
        <input
          id={fieldId}
          name={name}
          type="checkbox"
          className={cn(
            "mt-0.5 size-4 shrink-0 rounded border-line-strong accent-brand",
            className,
          )}
          {...props}
        />
        <span>{label}</span>
      </label>
      {error ? (
        <p className="flex items-start gap-1.5 pl-6 text-xs font-medium text-brand">
          <Icon name="alertCircle" className="mt-0.5 size-3.5 shrink-0 text-danger" />
          {error}
        </p>
      ) : null}
    </div>
  );
}
