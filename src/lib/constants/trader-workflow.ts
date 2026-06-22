import { isKgOnlyBusiness, isWeightFirstBusiness } from "@/lib/constants/product-units";

/** Mandi / tobacco / farm — buy-first Tally-style flow (not retail catalog-first). */
export function usesTraderWorkflow(businessType: string) {
  return (
    isKgOnlyBusiness(businessType) ||
    isWeightFirstBusiness(businessType) ||
    businessType === "GENERAL_TRADING"
  );
}
