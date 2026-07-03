import type { ProductUnit } from "@/lib/constants/product-units";
import { generateNextProductSku } from "@/lib/products/sku";
import { prisma } from "@/lib/prisma";

type EnsureProductInput = {
  name: string;
  unitCost: number;
  unitPrice: number;
  unit?: ProductUnit;
  gstRate?: number;
  hsnCode?: string;
};

export async function findOrCreateProductForPurchase(
  client: unknown,
  businessId: string,
  businessType: string,
  input: EnsureProductInput,
): Promise<string> {
  const db = client as typeof prisma;
  const name = input.name.trim();

  if (!name) {
    throw new Error("Item name is required on the purchase line.");
  }

  const existing = await db.product.findFirst({
    where: {
      businessId,
      name: { equals: name, mode: "insensitive" },
    },
  });

  if (existing) {
    await db.product.update({
      where: { id: existing.id },
      data: {
        costPrice: input.unitCost,
        unitPrice: input.unitPrice,
        ...(input.hsnCode?.trim() ? { hsnCode: input.hsnCode.trim() } : {}),
      },
    });
    return existing.id;
  }

  const unit = input.unit ?? "kg";
  const sku = await generateNextProductSku(businessId, businessType);

  const created = await db.product.create({
    data: {
      businessId,
      sku,
      name,
      unit,
      unitPrice: input.unitPrice,
      costPrice: input.unitCost,
      gstRate: input.gstRate ?? 0,
      hsnCode: input.hsnCode ?? (unit === "kg" ? "2401" : undefined),
      inventory: {
        create: {
          quantity: 0,
          lowStockThreshold: unit === "kg" ? 50 : 10,
        },
      },
    },
  });

  return created.id;
}
