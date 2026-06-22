import { getAccountingDb } from "@/lib/prisma-accounting";

type AuditLogInput = {
  businessId: string;
  action: string;
  entityType: string;
  entityId?: string;
  entityLabel?: string;
  details?: Record<string, unknown>;
  performedBy: string;
};

export const AUDIT_ACTIONS = {
  INVOICE_CREATED: "INVOICE_CREATED",
  INVOICE_UPDATED: "INVOICE_UPDATED",
  INVOICE_DELETED: "INVOICE_DELETED",
  PURCHASE_CREATED: "PURCHASE_CREATED",
  PURCHASE_UPDATED: "PURCHASE_UPDATED",
  PURCHASE_DELETED: "PURCHASE_DELETED",
  JOURNAL_POSTED: "JOURNAL_POSTED",
  VOUCHER_POSTED: "VOUCHER_POSTED",
} as const;

export async function logAuditEvent(
  client: unknown,
  input: AuditLogInput,
) {
  const db = getAccountingDb(client) as {
    auditLog: { create: (args: unknown) => Promise<unknown> };
  };

  await db.auditLog.create({
    data: {
      businessId: input.businessId,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      entityLabel: input.entityLabel,
      details: input.details ? JSON.stringify(input.details) : undefined,
      performedBy: input.performedBy,
    },
  });
}

export async function getAuditLogs(
  businessId: string,
  options?: { from?: Date; to?: Date; limit?: number },
) {
  const db = getAccountingDb();
  const where: Record<string, unknown> = { businessId };

  if (options?.from || options?.to) {
    where.createdAt = {
      ...(options.from ? { gte: options.from } : {}),
      ...(options.to ? { lte: options.to } : {}),
    };
  }

  return (await db.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: options?.limit ?? 100,
  })) as Array<{
    id: string;
    action: string;
    entityType: string;
    entityId: string | null;
    entityLabel: string | null;
    details: string | null;
    performedBy: string;
    createdAt: Date;
  }>;
}
