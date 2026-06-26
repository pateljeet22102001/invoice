import { prisma } from "@/lib/prisma";
import { getSupplierDb } from "@/lib/prisma-purchase";

type EnsureSupplierInput = {
  name: string;
  purchaseType: string;
  state?: string | null;
  village?: string | null;
};

function supplierTypeForPurchase(purchaseType: string) {
  if (purchaseType === "FARMER") return "FARMER" as const;
  if (purchaseType === "UNREGISTERED") return "UNREGISTERED" as const;
  if (purchaseType === "APMC_MANDI") return "FARMER" as const;
  return "OTHER" as const;
}

export async function findOrCreateSupplierForPurchase(
  client: unknown,
  businessId: string,
  input: EnsureSupplierInput,
): Promise<string> {
  const db = client as typeof prisma;
  const name = input.name.trim();

  if (!name) {
    throw new Error("Farmer or supplier name is required.");
  }

  const existing = (await getSupplierDb(db).findFirst({
    where: {
      businessId,
      name: { equals: name, mode: "insensitive" },
    },
  })) as { id: string } | null;

  if (existing) {
    return existing.id;
  }

  const created = (await getSupplierDb(db).create({
    data: {
      businessId,
      name,
      supplierType: supplierTypeForPurchase(input.purchaseType),
      state: input.state?.trim() || undefined,
      village: input.village?.trim() || undefined,
    },
  })) as { id: string };

  return created.id;
}
