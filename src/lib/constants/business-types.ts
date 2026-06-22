export const INDIAN_BUSINESS_TYPES = [
  {
    value: "GENERAL_TRADING",
    label: "General Trading",
    description: "Buy and sell goods — traders, distributors",
  },
  {
    value: "WHOLESALE",
    label: "Wholesale Business",
    description: "Bulk selling to retailers or other businesses",
  },
  {
    value: "RETAIL",
    label: "Retail Shop",
    description: "Direct sales to customers from a shop/store",
  },
  {
    value: "MANUFACTURING",
    label: "Manufacturing",
    description: "Produce and sell finished goods",
  },
  {
    value: "SERVICES",
    label: "Services",
    description: "Professional or service-based business",
  },
  {
    value: "TOBACCO",
    label: "Tobacco Business",
    description: "Tobacco products — license required in India",
    needsLicense: true,
    licenseLabel: "Tobacco / Excise License No.",
  },
  {
    value: "APMC_COMMISSION",
    label: "APMC Commission Agent",
    description: "APMC commission agent — agriculture produce market",
    needsApmc: true,
    needsCommission: true,
  },
  {
    value: "AGRICULTURE",
    label: "Agriculture / Farm Produce",
    description: "Farmers, produce sellers, cold storage",
  },
  {
    value: "PHARMA",
    label: "Pharmacy / Medical",
    description: "Medicines and healthcare products",
    needsLicense: true,
    licenseLabel: "Drug License No.",
  },
  {
    value: "RESTAURANT",
    label: "Restaurant / Food Business",
    description: "FSSAI registered food business",
    needsLicense: true,
    licenseLabel: "FSSAI License No.",
  },
  {
    value: "TRANSPORT",
    label: "Transport / Logistics",
    description: "Goods transport, courier, fleet",
  },
  {
    value: "OTHER",
    label: "Other",
    description: "Any other type of business",
  },
] as const;

export type IndianBusinessTypeValue =
  (typeof INDIAN_BUSINESS_TYPES)[number]["value"];

export function getBusinessTypeLabel(value: string) {
  return (
    INDIAN_BUSINESS_TYPES.find((t) => t.value === value)?.label ?? value
  );
}
