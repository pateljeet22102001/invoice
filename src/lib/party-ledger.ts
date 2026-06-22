import { prisma } from "@/lib/prisma";
import { getPurchaseDb } from "@/lib/prisma-purchase";

export type PartyKhataRow = {
  id: string;
  name: string;
  phone: string | null;
  gstin: string | null;
  billCount: number;
  totalBilled: number;
  outstanding: number;
};

export type KhataEntry = {
  id: string;
  number: string;
  date: Date;
  type: "invoice" | "purchase";
  status: string;
  total: number;
  outstanding: number;
  href: string;
};

const RECEIVABLE_STATUSES = ["SENT", "OVERDUE"] as const;
const PAYABLE_STATUSES = ["RECEIVED"] as const;

export async function getCustomerKhataList(businessId: string): Promise<PartyKhataRow[]> {
  const customers = await prisma.customer.findMany({
    where: { businessId },
    include: {
      invoices: {
        where: { status: { notIn: ["CANCELLED", "DRAFT"] } },
        select: { status: true, total: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return customers
    .map((customer) => {
      const bills = customer.invoices;
      const outstanding = bills
        .filter((inv) => RECEIVABLE_STATUSES.includes(inv.status as (typeof RECEIVABLE_STATUSES)[number]))
        .reduce((sum, inv) => sum + inv.total, 0);
      const totalBilled = bills.reduce((sum, inv) => sum + inv.total, 0);

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        gstin: customer.gstin,
        billCount: bills.length,
        totalBilled,
        outstanding,
      };
    })
    .sort((a, b) => b.outstanding - a.outstanding);
}

export async function getSupplierKhataList(businessId: string): Promise<PartyKhataRow[]> {
  const suppliers = await prisma.supplier.findMany({
    where: { businessId },
    include: {
      purchaseBills: {
        where: { status: { notIn: ["CANCELLED"] } },
        select: { status: true, total: true },
      },
    },
    orderBy: { name: "asc" },
  });

  return suppliers
    .map((supplier) => {
      const bills = supplier.purchaseBills;
      const outstanding = bills
        .filter((p) => PAYABLE_STATUSES.includes(p.status as (typeof PAYABLE_STATUSES)[number]))
        .reduce((sum, p) => sum + p.total, 0);
      const totalBilled = bills
        .filter((p) => p.status !== "DRAFT")
        .reduce((sum, p) => sum + p.total, 0);

      return {
        id: supplier.id,
        name: supplier.name,
        phone: supplier.phone,
        gstin: supplier.gstin,
        billCount: bills.filter((p) => p.status !== "DRAFT").length,
        totalBilled,
        outstanding,
      };
    })
    .sort((a, b) => b.outstanding - a.outstanding);
}

export async function getCustomerKhataDetail(businessId: string, customerId: string) {
  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId },
    include: {
      invoices: {
        where: { status: { notIn: ["CANCELLED"] } },
        orderBy: { issueDate: "desc" },
      },
    },
  });

  if (!customer) return null;

  const entries: KhataEntry[] = customer.invoices.map((inv) => ({
    id: inv.id,
    number: inv.invoiceNumber,
    date: inv.issueDate,
    type: "invoice",
    status: inv.status,
    total: inv.total,
    outstanding: RECEIVABLE_STATUSES.includes(inv.status as (typeof RECEIVABLE_STATUSES)[number])
      ? inv.total
      : 0,
    href: `/invoices/${inv.id}`,
  }));

  const outstanding = entries.reduce((sum, e) => sum + e.outstanding, 0);
  const totalBilled = entries
    .filter((e) => e.status !== "DRAFT")
    .reduce((sum, e) => sum + e.total, 0);

  return {
    party: {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      gstin: customer.gstin,
      kind: "customer" as const,
    },
    entries,
    outstanding,
    totalBilled,
  };
}

export async function getSupplierKhataDetail(businessId: string, supplierId: string) {
  const supplier = await prisma.supplier.findFirst({
    where: { id: supplierId, businessId },
  });

  if (!supplier) return null;

  const purchases = (await getPurchaseDb(prisma).findMany({
    where: { businessId, supplierId, status: { notIn: ["CANCELLED"] } },
    orderBy: { billDate: "desc" },
    select: {
      id: true,
      purchaseNumber: true,
      billDate: true,
      status: true,
      total: true,
    },
  })) as Array<{
    id: string;
    purchaseNumber: string;
    billDate: Date;
    status: string;
    total: number;
  }>;

  const entries: KhataEntry[] = purchases.map((p) => ({
    id: p.id,
    number: p.purchaseNumber,
    date: p.billDate,
    type: "purchase",
    status: p.status,
    total: p.total,
    outstanding: PAYABLE_STATUSES.includes(p.status as (typeof PAYABLE_STATUSES)[number])
      ? p.total
      : 0,
    href: `/purchases/${p.id}`,
  }));

  const outstanding = entries.reduce((sum, e) => sum + e.outstanding, 0);
  const totalBilled = entries
    .filter((e) => e.status !== "DRAFT")
    .reduce((sum, e) => sum + e.total, 0);

  return {
    party: {
      id: supplier.id,
      name: supplier.name,
      phone: supplier.phone,
      gstin: supplier.gstin,
      kind: "supplier" as const,
    },
    entries,
    outstanding,
    totalBilled,
  };
}

export async function getKhataSummary(businessId: string) {
  const [customers, suppliers] = await Promise.all([
    getCustomerKhataList(businessId),
    getSupplierKhataList(businessId),
  ]);

  return {
    totalReceivable: customers.reduce((sum, c) => sum + c.outstanding, 0),
    totalPayable: suppliers.reduce((sum, s) => sum + s.outstanding, 0),
    customersWithDue: customers.filter((c) => c.outstanding > 0).length,
    suppliersWithDue: suppliers.filter((s) => s.outstanding > 0).length,
  };
}
