import { notFound } from "next/navigation";
import { getPurchaseDb } from "@/lib/prisma-purchase";
import { prisma } from "@/lib/prisma";
import type { PurchaseDetail } from "@/types/models";

export async function getPurchaseDetail(
  businessId: string,
  purchaseId: string,
): Promise<PurchaseDetail> {
  const purchase = (await getPurchaseDb(prisma).findFirst({
    where: { id: purchaseId, businessId },
    include: {
      supplier: true,
      commissionAgent: true,
      items: { include: { product: { select: { id: true, name: true, sku: true, hsnCode: true, unit: true } } } },
      business: true,
    },
  })) as PurchaseDetail | null;

  if (!purchase) {
    notFound();
  }

  return purchase;
}
