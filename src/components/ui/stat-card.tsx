import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "success" | "warning" | "danger";
}

const toneStyles = {
  default: "border-slate-200 bg-white",
  success: "border-emerald-200 bg-emerald-50",
  warning: "border-amber-200 bg-amber-50",
  danger: "border-rose-200 bg-rose-50",
};

export function StatCard({
  label,
  value,
  hint,
  tone = "default",
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-5 shadow-sm",
        toneStyles[tone],
      )}
    >
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
        {value}
      </p>
      {hint && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
