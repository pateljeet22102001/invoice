"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";
import {
  buildInvoiceWhatsAppMessage,
  buildWhatsAppUrl,
  normalizeWhatsAppPhone,
} from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

type InvoiceWhatsAppShareProps = {
  invoiceId: string;
  invoiceNumber: string;
  businessName: string;
  customerName: string;
  customerPhone: string | null;
  totalLabel: string;
  dueDateLabel: string;
  className?: string;
  compact?: boolean;
};

export function InvoiceWhatsAppShare({
  invoiceId,
  invoiceNumber,
  businessName,
  customerName,
  customerPhone,
  totalLabel,
  dueDateLabel,
  className,
  compact = false,
}: InvoiceWhatsAppShareProps) {
  const [sharing, setSharing] = useState(false);
  const [hint, setHint] = useState<string | null>(null);

  const message = buildInvoiceWhatsAppMessage({
    invoiceNumber,
    businessName,
    customerName,
    totalLabel,
    dueDateLabel,
  });

  const waUrl = customerPhone ? buildWhatsAppUrl(customerPhone, message) : null;
  const hasPhone = !!normalizeWhatsAppPhone(customerPhone);

  async function shareWithPdf() {
    if (!hasPhone || !waUrl) {
      setHint("Add customer phone number to send on WhatsApp.");
      return;
    }

    setSharing(true);
    setHint(null);

    try {
      const response = await fetch(`/api/invoices/${invoiceId}/pdf`);
      if (!response.ok) {
        throw new Error("Could not load invoice PDF.");
      }

      const blob = await response.blob();
      const file = new File([blob], `${invoiceNumber}.pdf`, {
        type: "application/pdf",
      });

      if (
        typeof navigator !== "undefined" &&
        navigator.share &&
        (!navigator.canShare || navigator.canShare({ files: [file] }))
      ) {
        await navigator.share({
          files: [file],
          text: message,
          title: `Invoice ${invoiceNumber}`,
        });
        setHint("Shared via WhatsApp or your device share menu.");
        return;
      }

      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `${invoiceNumber}.pdf`;
      link.click();
      URL.revokeObjectURL(downloadUrl);

      window.open(waUrl, "_blank", "noopener,noreferrer");
      setHint("PDF downloaded. WhatsApp opened — attach the PDF and send.");
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      if (waUrl) {
        window.open(waUrl, "_blank", "noopener,noreferrer");
        setHint("WhatsApp opened. Download PDF separately if needed.");
      } else {
        setHint("Could not open WhatsApp. Check customer phone number.");
      }
    } finally {
      setSharing(false);
    }
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={() => void shareWithPdf()}
        disabled={!hasPhone || sharing}
        title={
          hasPhone
            ? "Send invoice on WhatsApp"
            : "Add customer phone to use WhatsApp"
        }
        className={cn(
          "inline-flex items-center gap-1 text-sm font-medium text-emerald-600 hover:text-emerald-500 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
      >
        <MessageCircle className="h-4 w-4" />
        {sharing ? "..." : "WhatsApp"}
      </button>
    );
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => void shareWithPdf()}
        disabled={!hasPhone || sharing}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg bg-[#25D366] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1ebe57] disabled:cursor-not-allowed disabled:opacity-60",
        )}
      >
        <MessageCircle className="h-4 w-4" />
        {sharing ? "Opening..." : "Send on WhatsApp"}
      </button>

      {!hasPhone && (
        <p className="mt-2 text-xs text-amber-600">
          Add customer phone in Customers to enable WhatsApp send.
        </p>
      )}

      {hint && (
        <p className="mt-2 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  );
}
