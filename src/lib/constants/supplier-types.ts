export const SUPPLIER_TYPE_OPTIONS = [
  { value: "B2B_SUPPLIER", label: "B2B Supplier (GST registered)" },
  { value: "FARMER", label: "Farmer / Producer" },
  { value: "APMC_AGENT", label: "APMC / Commission Agent" },
  { value: "UNREGISTERED", label: "Unregistered dealer" },
  { value: "OTHER", label: "Other" },
] as const;

export const PURCHASE_TYPE_OPTIONS = [
  { value: "B2B", label: "B2B Purchase — GST input credit" },
  { value: "FARMER", label: "Farmer purchase — GSTIN optional" },
  { value: "APMC_MANDI", label: "APMC market purchase — with commission" },
  { value: "UNREGISTERED", label: "Unregistered purchase" },
] as const;

export function supplierTypeLabel(value: string) {
  return SUPPLIER_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function purchaseTypeLabel(value: string) {
  return PURCHASE_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
