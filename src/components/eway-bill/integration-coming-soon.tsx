"use client";

import { Clock, ExternalLink, Truck } from "lucide-react";
import { EWAY_BILL_GOVT_PORTAL } from "@/lib/eway-bill";

const FUTURE_FEATURES = [
  "Generate e-way bill directly from invoice / challan",
  "Auto-fill e-way bill number on your document",
  "Supplier & recipient GSTIN from your data",
  "Place of dispatch & delivery",
  "Vehicle number & transporter details",
  "Validity date & distance (from government)",
  "Print e-way bill PDF with QR code",
];

export function EwayBillIntegrationComingSoon({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-indigo-200 bg-white shadow-sm">
      <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-4 text-white">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            <h3 className="text-base font-semibold">Government E-way Bill Integration</h3>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wide">
            <Clock className="h-3.5 w-3.5" />
            Coming Soon
          </span>
        </div>
        <p className="mt-2 text-sm text-indigo-100">
          Direct connection to India GST NIC portal — same as ewaybillgst.gov.in
        </p>
      </div>

      <div className={compact ? "p-4" : "p-6"}>
        <button
          type="button"
          disabled
          className="w-full cursor-not-allowed rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-4 text-center"
        >
          <p className="text-sm font-semibold text-slate-500">
            Generate E-way Bill from Government API
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Integration coming soon — use manual entry below for now
          </p>
        </button>

        {!compact && (
          <>
            <p className="mt-6 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Preview — what you will get after integration
            </p>

            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
              <div className="flex items-start justify-between border-b border-slate-200 pb-3">
                <div>
                  <p className="text-lg font-bold text-slate-900">e-Way Bill</p>
                  <p className="mt-1 text-xs text-slate-500">
                    e-Way Bill No: <span className="font-mono">XXXX XXXX XXXX</span>
                  </p>
                  <p className="text-xs text-slate-500">
                    e-Way Bill Date: — (auto from government)
                  </p>
                </div>
                <div className="flex h-14 w-14 items-center justify-center rounded border border-slate-300 bg-white text-[8px] text-slate-400">
                  QR Code
                </div>
              </div>

              <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                <div>
                  <p className="font-semibold text-slate-700">Part A — Transaction</p>
                  <ul className="mt-1 space-y-0.5 text-slate-600">
                    <li>GSTIN of Supplier (your business)</li>
                    <li>Place of Dispatch</li>
                    <li>GSTIN of Recipient (customer)</li>
                    <li>Place of Delivery</li>
                    <li>Document No (invoice / challan)</li>
                    <li>Value of Goods</li>
                    <li>Reason for Transportation</li>
                    <li>Transporter name & GSTIN</li>
                  </ul>
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Part B — Vehicle</p>
                  <ul className="mt-1 space-y-0.5 text-slate-600">
                    <li>Mode: Road / Rail / Air</li>
                    <li>Vehicle Number</li>
                    <li>From / Entered Date</li>
                    <li>Validity (Valid From → Valid Until)</li>
                  </ul>
                </div>
              </div>

              <p className="mt-3 border-t border-slate-200 pt-3 text-xs text-slate-500">
                Number will auto-attach to your invoice &amp; print on PDF
              </p>
            </div>

            <ul className="mt-6 grid gap-2 sm:grid-cols-2">
              {FUTURE_FEATURES.map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2 text-sm text-slate-600"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
                  {feature}
                </li>
              ))}
            </ul>
          </>
        )}

        <a
          href={EWAY_BILL_GOVT_PORTAL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-500"
        >
          Until then: use GST E-way Bill Portal
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
