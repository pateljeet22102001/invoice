export const PURCHASE_PAYMENT_MODE_OPTIONS = [
  { value: "CASH", label: "Cash — paid same day" },
  { value: "CHEQUE", label: "Cheque" },
  { value: "CREDIT", label: "Credit — pay farmer later" },
] as const;

export type PurchasePaymentMode = (typeof PURCHASE_PAYMENT_MODE_OPTIONS)[number]["value"];

export function purchasePaymentModeLabel(value: string) {
  return PURCHASE_PAYMENT_MODE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
