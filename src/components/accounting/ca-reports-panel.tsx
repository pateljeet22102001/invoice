"use client";

import { useRouter } from "next/navigation";

export function CaPeriodForm({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  const router = useRouter();

  return (
    <form
      className="flex flex-wrap items-end gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const fromDate = String(data.get("from") ?? "");
        const toDate = String(data.get("to") ?? "");
        router.push(
          `/accounting/ca-reports?from=${fromDate}&to=${toDate}`,
        );
      }}
    >
      <div>
        <label
          htmlFor="from"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          From date
        </label>
        <input
          id="from"
          name="from"
          type="date"
          required
          defaultValue={from}
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />
      </div>
      <div>
        <label
          htmlFor="to"
          className="mb-1.5 block text-sm font-medium text-slate-700"
        >
          To date
        </label>
        <input
          id="to"
          name="to"
          type="date"
          required
          defaultValue={to}
          className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />
      </div>
      <button
        type="submit"
        className="rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"
      >
        Apply period
      </button>
    </form>
  );
}

export function CaExportLinks({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  const query = `from=${from}&to=${to}`;
  const exports = [
    { label: "Trial Balance", report: "trial-balance" },
    { label: "Profit & Loss", report: "profit-loss" },
    { label: "Balance Sheet", report: "balance-sheet" },
    { label: "Day Book", report: "day-book" },
    { label: "Audit Trail", report: "audit-log" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {exports.map((item) => (
        <a
          key={item.report}
          href={`/api/ca/export?report=${item.report}&${query}`}
          className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          ↓ {item.label} (CSV)
        </a>
      ))}
    </div>
  );
}
