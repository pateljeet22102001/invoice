"use client";

import { useTransition } from "react";

export function DeleteButton({
  action,
  label,
  confirmMessage,
  className,
}: {
  action: () => Promise<{ error?: string } | void>;
  label?: string;
  confirmMessage: string;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(confirmMessage)) return;

        startTransition(async () => {
          const result = await action();
          if (result?.error) {
            window.alert(result.error);
          }
        });
      }}
      className={
        className ??
        "rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-medium text-rose-600 transition hover:bg-rose-50 disabled:opacity-60"
      }
    >
      {pending ? "Deleting..." : (label ?? "Delete")}
    </button>
  );
}
