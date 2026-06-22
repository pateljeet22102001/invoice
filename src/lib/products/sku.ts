import { prisma } from "@/lib/prisma";
import { isKgOnlyBusiness } from "@/lib/constants/product-units";
import type { ProductUnit } from "@/lib/constants/product-units";

/** Tobacco / mandi / farm traders use item names — not retail SKU. Auto-code stays internal. */
export function shouldAutoGenerateSku(businessType: string, unit: ProductUnit) {
  return isKgOnlyBusiness(businessType) || unit === "kg";
}

function skuPrefix(businessType: string) {
  if (businessType === "TOBACCO") return "TOB";
  if (businessType === "AGRICULTURE") return "AGR";
  if (businessType === "APMC_COMMISSION") return "MND";
  return "ITM";
}

export async function generateNextProductSku(
  businessId: string,
  businessType: string,
): Promise<string> {
  const prefix = skuPrefix(businessType);
  const existing = await prisma.product.findMany({
    where: { businessId, sku: { startsWith: `${prefix}-` } },
    select: { sku: true },
  });

  let max = 0;
  for (const row of existing) {
    const match = row.sku.match(new RegExp(`^${prefix}-(\\d+)$`));
    if (match) max = Math.max(max, Number(match[1]));
  }

  let candidate = `${prefix}-${String(max + 1).padStart(3, "0")}`;
  while (
    await prisma.product.findUnique({
      where: { businessId_sku: { businessId, sku: candidate } },
    })
  ) {
    max += 1;
    candidate = `${prefix}-${String(max + 1).padStart(3, "0")}`;
  }

  return candidate;
}
