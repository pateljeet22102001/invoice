/** PDF-safe INR formatting — avoids Unicode rupee (often shows as red boxes in Helvetica). */
export function formatPdfRs(amount: number) {
  return `Rs. ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function splitPdfRsPaise(amount: number) {
  const rupees = Math.floor(amount);
  const paise = Math.round((amount - rupees) * 100);
  return {
    rupees: rupees.toLocaleString("en-IN"),
    paise: String(paise).padStart(2, "0"),
  };
}

export function formatPdfQty(quantity: number, unit?: string | null) {
  const value = quantity.toLocaleString("en-IN", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  });
  return unit ? `${value} ${unit}` : value;
}

export function formatPdfDate(date: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

export function formatPdfAddress(parts: (string | null | undefined)[]) {
  return parts.filter(Boolean).join(", ");
}
