"use client";

import { useState } from "react";

export function Gstr2bExportPanel({ defaultPeriod }: { defaultPeriod: string }) {
  const [period, setPeriod] = useState(defaultPeriod);

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6">
      <h2 className="text-lg font-semibold text-emerald-950">GSTR-2B Export (Purchases)</h2>
      <p className="mt-1 text-sm text-emerald-800">
        Download inward supply data from purchase bills — B2B supplier invoices, mandi seller
        bills, and commission agent GST bills. Use to match ITC with portal / CA.
      </p>

      <div className="mt-4 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="gstr2b-period" className="mb-1 block text-xs font-medium text-emerald-900">
            Return period (month)
          </label>
          <input
            id="gstr2b-period"
            type="month"
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-lg border border-emerald-300 bg-white px-3 py-2 text-sm text-slate-900"
          />
        </div>
        <a
          href={`/api/gst/gstr2b?period=${period}`}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Download Inward CSV
        </a>
      </div>

      <p className="mt-3 text-xs text-emerald-700">
        Includes B2B purchases and mandi bills with supplier GSTIN + bill number. Commission
        agent rows when agent GST bill is entered. Draft &amp; cancelled excluded.
      </p>
    </div>
  );
}
