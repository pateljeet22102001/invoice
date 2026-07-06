export const SUPPLIER_TYPE_OPTIONS = [
  { value: "B2B_SUPPLIER", label: "B2B Supplier (GST registered)" },
  { value: "FARMER", label: "Farmer / Producer" },
  { value: "APMC_AGENT", label: "Commission Agent (APMC)" },
  { value: "UNREGISTERED", label: "Unregistered dealer" },
  { value: "OTHER", label: "Other" },
] as const;

export const PURCHASE_TYPE_OPTIONS = [
  { value: "FARMER", label: "Farmer bill" },
  { value: "APMC_MANDI", label: "Mandi bill" },
  { value: "B2B", label: "B2B bill" },
] as const;

export const PURCHASE_TYPE_HINTS: Record<
  (typeof PURCHASE_TYPE_OPTIONS)[number]["value"],
  string
> = {
  FARMER: "Direct purchase from farmer",
  APMC_MANDI: "Mandi shop name, shop no., GST — then I-Form",
  B2B: "GST tax invoice from registered supplier",
};

export function supplierTypeLabel(value: string) {
  return SUPPLIER_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function purchaseTypeLabel(value: string) {
  const option = PURCHASE_TYPE_OPTIONS.find((o) => o.value === value);
  if (option) return option.label;
  if (value === "UNREGISTERED") return "Contract / trade area";
  return value;
}
