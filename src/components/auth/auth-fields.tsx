import { cn } from "@/lib/utils";

export function AuthField({
  label,
  id,
  required,
  hint,
  className,
  ...props
}: React.ComponentProps<"input"> & {
  label: string;
  hint?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      <input
        id={id}
        name={id}
        required={required}
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        {...props}
      />
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}

export function AuthSelect({
  label,
  id,
  required,
  options,
  placeholder,
  className,
}: {
  label: string;
  id: string;
  required?: boolean;
  placeholder?: string;
  options: readonly string[];
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-rose-500"> *</span>}
      </label>
      <select
        id={id}
        name={id}
        required={required}
        defaultValue=""
        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
      >
        <option value="" disabled>
          {placeholder ?? "Select"}
        </option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export function AuthSuccess({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
      {message}
    </div>
  );
}

export function AuthError({ message }: { message?: string }) {
  if (!message) return null;

  return (
    <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {message}
    </div>
  );
}

export function AuthSubmitButton({
  children,
  pending,
}: {
  children: React.ReactNode;
  pending?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        "w-full rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500",
        pending && "cursor-not-allowed opacity-70",
      )}
    >
      {pending ? "Please wait..." : children}
    </button>
  );
}
