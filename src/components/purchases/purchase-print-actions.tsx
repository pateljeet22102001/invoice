"use client";

import { Download, Printer } from "lucide-react";

export function PurchasePrintActions({
  purchaseId,
  purchaseNumber,
  purchaseType,
}: {
  purchaseId: string;
  purchaseNumber: string;
  purchaseType: string;
}) {
  const pdfUrl = `/api/purchases/${purchaseId}/pdf?t=a4`;
  const isFarmerReceipt =
    purchaseType === "FARMER" || purchaseType === "UNREGISTERED";
  const printLabel = isFarmerReceipt ? "Print for farmer" : "Print bill";

  function handlePrint() {
    const popup = window.open(pdfUrl, "_blank", "noopener,noreferrer");
    popup?.addEventListener("load", () => {
      popup.print();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={handlePrint}
        className="inline-flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 transition hover:bg-emerald-100"
      >
        <Printer className="h-4 w-4" />
        {printLabel}
      </button>
      <a
        href={pdfUrl}
        download={`${purchaseNumber}${isFarmerReceipt ? "-receipt" : "-bill"}.pdf`}
        className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
      >
        <Download className="h-4 w-4" />
        Download PDF
      </a>
    </div>
  );
}
