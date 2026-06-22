/** Normalize Indian mobile numbers for wa.me (digits only, with country code 91). */
export function normalizeWhatsAppPhone(phone: string | null | undefined): string | null {
  if (!phone) return null;

  let digits = phone.replace(/\D/g, "");

  if (digits.startsWith("0")) {
    digits = digits.slice(1);
  }

  if (digits.length === 10) {
    digits = `91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  }

  if (digits.length >= 11 && digits.length <= 15) {
    return digits;
  }

  return null;
}

export type InvoiceWhatsAppPayload = {
  invoiceNumber: string;
  businessName: string;
  customerName: string;
  totalLabel: string;
  dueDateLabel: string;
};

export function buildInvoiceWhatsAppMessage(payload: InvoiceWhatsAppPayload) {
  return [
    `Hello ${payload.customerName},`,
    "",
    `Your GST invoice *${payload.invoiceNumber}* from *${payload.businessName}*.`,
    "",
    `Amount: *${payload.totalLabel}*`,
    `Due date: ${payload.dueDateLabel}`,
    "",
    "Please find the invoice PDF attached.",
    "",
    `Thank you,`,
    payload.businessName,
  ].join("\n");
}

export function buildWhatsAppUrl(phone: string, message: string) {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return null;

  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
