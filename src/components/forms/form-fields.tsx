import Link from "next/link";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export const FormField = forwardRef<
  HTMLInputElement,
  React.ComponentProps<"input"> & {
    label: string;
    hint?: string;
    name?: string;
  }
>(function FormField(
  { label, id, name, required, hint, className, ...props },
  ref,
) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      <input
        ref={ref}
        id={id}
        name={name !== undefined ? name : id}
        required={required}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        {...props}
      />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
});

export function FormTextarea({
  label,
  id,
  name,
  required,
  hint,
  className,
  rows = 3,
  ...props
}: React.ComponentProps<"textarea"> & {
  label: string;
  hint?: string;
  name?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      <textarea
        id={id}
        name={name ?? id}
        required={required}
        rows={rows}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        {...props}
      />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function FormSelect({
  label,
  id,
  name,
  required,
  hint,
  placeholder,
  options,
  className,
  defaultValue,
  value,
  onChange,
  autoComplete,
}: {
  label: string;
  id: string;
  name?: string;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  defaultValue?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLSelectElement>;
  autoComplete?: string;
  options: { value: string; label: string }[];
  className?: string;
}) {
  const isControlled = value !== undefined;
  const selectProps = isControlled
    ? { value: value ?? "", onChange }
    : { defaultValue: defaultValue ?? "" };

  const showPlaceholder =
    !isControlled || !value || (placeholder !== undefined && value === "");

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      <select
        id={id}
        name={name !== undefined ? name : id}
        required={required}
        autoComplete={autoComplete}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        {...selectProps}
      >
        {showPlaceholder && (
          <option value="" disabled>
            {placeholder ?? "Select"}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {message}
    </div>
  );
}

export function FormSubmitButton({
  children,
  pending,
  className,
}: {
  children: React.ReactNode;
  pending?: boolean;
  className?: string;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500",
        pending && "cursor-not-allowed opacity-70",
        className,
      )}
    >
      {pending ? "Saving..." : children}
    </button>
  );
}

export function FormActions({
  cancelHref,
  pending,
  submitLabel,
}: {
  cancelHref: string;
  pending?: boolean;
  submitLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 pt-6">
      <FormSubmitButton pending={pending}>{submitLabel}</FormSubmitButton>
      <Link
        href={cancelHref}
        className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
      >
        Cancel
      </Link>
    </div>
  );
}

export function FormCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full max-w-3xl rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {description && (
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      )}
      <div className="mt-6">{children}</div>
    </div>
  );
}
