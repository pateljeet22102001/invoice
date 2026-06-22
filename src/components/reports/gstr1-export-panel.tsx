"use client";

import { useState } from "react";

export function Gstr1ExportPanel({ defaultPeriod }: { defaultPeriod: string }) {
  const [period, setPeriod] = useState(defaultPeriod);

  return (
    <div className="rounded-2xl border border-violet-200 bg-violet-50 p-6">
      <h2 className="text-lg font-semibold text-violet-950">GSTR-1 Export</h2>
      <p className="mt-1 text-sm text-violet-800">
        Download outward supply data for GST filing — B2B invoices and HSN summary (CSV for
        CA / Excel).
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="gstr1-period" className="mb-1 block text-xs font-medium text-violet-900">
            Return period (month)
          </label>
          <input
            id="gstr1-period"
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-violet-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </div>
        <a
          href={`/api/gst/gstr1?period=${period}&section=b2b`}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
        >
          Download B2B CSV
        </a>
        <a
          href={`/api/gst/gstr1?period=${period}&section=hsn`}
          className="rounded-lg border border-violet-400 bg-white px-4 py-2 text-sm font-medium text-violet-800 hover:bg-violet-100"
        >
          Download HSN CSV
        </a>
      </div>

      <p className="mt-3 text-xs text-violet-700">
        Includes invoices with status Sent, Paid, or Overdue. Draft and cancelled are excluded.
        Upload CSV to GST portal or share with your CA.
      </p>
    </div>
  );
}
