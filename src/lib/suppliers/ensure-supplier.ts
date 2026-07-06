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
  if (purchaseType === "APMC_MANDI") return "UNREGISTERED" as const;
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

type EnsureCommissionAgentInput = {
  name: string;
  shopLicenseNo: string;
  gstin?: string;
  state?: string | null;
};

export async function findOrCreateCommissionAgent(
  client: unknown,
  businessId: string,
  input: EnsureCommissionAgentInput,
): Promise<string> {
  const db = client as typeof prisma;
  const name = input.name.trim();
  const shopLicenseNo = input.shopLicenseNo.trim();
  const gstin = input.gstin?.trim().toUpperCase() || undefined;

  if (!name) {
    throw new Error("Mandi owner name is required.");
  }
  if (!shopLicenseNo) {
    throw new Error("Mandi shop number is required.");
  }

  const byShop = (await getSupplierDb(db).findFirst({
    where: {
      businessId,
      supplierType: "APMC_AGENT",
      shopLicenseNo: { equals: shopLicenseNo, mode: "insensitive" },
    },
  })) as { id: string; gstin: string | null } | null;

  if (byShop) {
    if (gstin && byShop.gstin !== gstin) {
      await getSupplierDb(db).update({
        where: { id: byShop.id },
        data: { gstin, name },
      });
    }
    return byShop.id;
  }

  const byName = (await getSupplierDb(db).findFirst({
    where: {
      businessId,
      supplierType: "APMC_AGENT",
      name: { equals: name, mode: "insensitive" },
    },
  })) as { id: string; gstin: string | null; shopLicenseNo: string | null } | null;

  if (byName) {
    await getSupplierDb(db).update({
      where: { id: byName.id },
      data: {
        shopLicenseNo,
        ...(gstin ? { gstin } : {}),
      },
    });
    return byName.id;
  }

  const created = (await getSupplierDb(db).create({
    data: {
      businessId,
      name,
      supplierType: "APMC_AGENT",
      shopLicenseNo,
      gstin,
      state: input.state?.trim() || undefined,
    },
  })) as { id: string };

  return created.id;
}
