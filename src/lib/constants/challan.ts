export const CHALLAN_PURPOSES = [
  {
    value: "STOCK_TRANSFER",
    label: "Stock Transfer",
    description: "Move goods to another business — no sale, no GST on challan",
  },
  {
    value: "JOB_WORK",
    label: "Job Work",
    description: "Send goods for processing / manufacturing",
  },
  {
    value: "SALE_ON_APPROVAL",
    label: "Sale on Approval",
    description: "Goods sent for approval before final sale",
  },
  {
    value: "OTHER",
    label: "Other",
    description: "Other movement of goods without tax invoice",
  },
] as const;

export type ChallanPurposeValue = (typeof CHALLAN_PURPOSES)[number]["value"];

export function getChallanPurposeLabel(value: string) {
  return CHALLAN_PURPOSES.find((p) => p.value === value)?.label ?? value;
}
