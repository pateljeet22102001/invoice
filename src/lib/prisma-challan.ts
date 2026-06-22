import { prisma } from "@/lib/prisma";

type ChallanDb = {
  findFirst: (args?: unknown) => Promise<unknown>;
  findMany: (args?: unknown) => Promise<unknown>;
  create: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
};

function asChallanDb(client: unknown): ChallanDb {
  return (client as unknown as { deliveryChallan: ChallanDb }).deliveryChallan;
}

/** Delivery challan DB — works with prisma or transaction client */
export function getChallanDb(client: unknown = prisma) {
  return asChallanDb(client);
}

export const challanDb = getChallanDb(prisma);
