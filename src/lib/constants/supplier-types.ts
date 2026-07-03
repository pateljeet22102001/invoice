export const SUPPLIER_TYPE_OPTIONS = [
  { value: "B2B_SUPPLIER", label: "B2B Supplier (GST registered)" },
  { value: "FARMER", label: "Farmer / Producer" },
  { value: "APMC_AGENT", label: "APMC / Commission Agent" },
  { value: "UNREGISTERED", label: "Unregistered dealer" },
  { value: "OTHER", label: "Other" },
] as const;

export const PURCHASE_TYPE_OPTIONS = [
  { value: "FARMER", label: "Farmer bill" },
  { value: "UNREGISTERED", label: "Contract / trade area" },
  { value: "APMC_MANDI", label: "APMC (mandi)" },
  { value: "B2B", label: "B2B (GST invoice)" },
] as const;

export const PURCHASE_TYPE_HINTS: Record<
  (typeof PURCHASE_TYPE_OPTIONS)[number]["value"],
  string
> = {
  FARMER: "Direct farmer purchase · raw produce · no APMC fee · usually no GST",
  UNREGISTERED:
    "Outside mandi (trade area / contract) · no mandi cess · usually no GST on raw produce",
  APMC_MANDI: "Direct mandi · your shop buys at your market · seller = trading co or farmer",
  B2B: "Registered supplier tax invoice · GSTIN · HSN · CGST/SGST or IGST",
};

export function supplierTypeLabel(value: string) {
  return SUPPLIER_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}

export function purchaseTypeLabel(value: string) {
  return PURCHASE_TYPE_OPTIONS.find((o) => o.value === value)?.label ?? value;
}
