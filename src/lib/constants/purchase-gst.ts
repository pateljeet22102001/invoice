export function defaultGstForPurchaseType(purchaseType: string): number {
  if (
    purchaseType === "FARMER" ||
    purchaseType === "UNREGISTERED" ||
    purchaseType === "APMC_MANDI"
  ) {
    return 0;
  }
  if (purchaseType === "B2B") return 18;
  return 0;
}
