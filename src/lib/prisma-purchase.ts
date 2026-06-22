import { prisma } from "@/lib/prisma";

type PurchaseBillDb = {
  findFirst: (args?: unknown) => Promise<unknown>;
  findMany: (args?: unknown) => Promise<unknown>;
  create: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
  deleteMany: (args?: unknown) => Promise<unknown>;
};

type PurchaseItemDb = {
  deleteMany: (args?: unknown) => Promise<unknown>;
};

type SupplierDb = {
  findFirst: (args?: unknown) => Promise<unknown>;
  findMany: (args?: unknown) => Promise<unknown>;
  create: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
  deleteMany: (args?: unknown) => Promise<unknown>;
};

function asPurchaseDb(client: unknown): PurchaseBillDb {
  return (client as unknown as { purchaseBill: PurchaseBillDb }).purchaseBill;
}

function asPurchaseItemDb(client: unknown): PurchaseItemDb {
  return (client as unknown as { purchaseItem: PurchaseItemDb }).purchaseItem;
}

function asSupplierDb(client: unknown): SupplierDb {
  return (client as unknown as { supplier: SupplierDb }).supplier;
}

export function getPurchaseDb(client: unknown = prisma) {
  return asPurchaseDb(client);
}

export function getPurchaseItemDb(client: unknown = prisma) {
  return asPurchaseItemDb(client);
}

export function getSupplierDb(client: unknown = prisma) {
  return asSupplierDb(client);
}

export const purchaseDb = getPurchaseDb(prisma);
export const purchaseItemDb = getPurchaseItemDb(prisma);
export const supplierDb = getSupplierDb(prisma);
