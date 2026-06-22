import { prisma } from "@/lib/prisma";

type AccountingDb = {
  account: {
    count: (args?: unknown) => Promise<unknown>;
    findMany: (args?: unknown) => Promise<unknown>;
    findFirst: (args?: unknown) => Promise<unknown>;
    create: (args: unknown) => Promise<unknown>;
    deleteMany: (args?: unknown) => Promise<unknown>;
  };
  journalEntry: {
    count: (args?: unknown) => Promise<unknown>;
    findMany: (args?: unknown) => Promise<unknown>;
    findFirst: (args?: unknown) => Promise<unknown>;
    create: (args: unknown) => Promise<unknown>;
    deleteMany: (args?: unknown) => Promise<unknown>;
  };
  journalLine: {
    findMany: (args?: unknown) => Promise<unknown>;
    aggregate: (args?: unknown) => Promise<unknown>;
    deleteMany: (args?: unknown) => Promise<unknown>;
  };
  auditLog: {
    findMany: (args?: unknown) => Promise<unknown>;
    create: (args: unknown) => Promise<unknown>;
    deleteMany: (args?: unknown) => Promise<unknown>;
  };
};

function asAccountingDb(client: unknown): AccountingDb {
  return client as AccountingDb;
}

export function getAccountingDb(client: unknown = prisma) {
  return asAccountingDb(client);
}

export const accountingDb = getAccountingDb(prisma);
