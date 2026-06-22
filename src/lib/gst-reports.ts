import { prisma } from "@/lib/prisma";
import { resolvePartyState, splitGstTax } from "@/lib/gst";

export type GstReportSummary = {
  totalSales: number;
  totalTax: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  invoiceCount: number;
  intraStateCount: number;
  interStateCount: number;
  businessGstin: string | null;
  businessState: string | null;
};

export type GstMonthlyRow = {
  month: string;
  label: string;
  sales: number;
  tax: number;
  cgst: number;
  sgst: number;
  igst: number;
  count: number;
};

export type GstInvoiceRow = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  customerGstin: string | null;
  issueDate: Date;
  status: string;
  subtotal: number;
  taxAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  isInterState: boolean;
  supplyLabel: string;
};

export type GstReportData = {
  summary: GstReportSummary;
  monthly: GstMonthlyRow[];
  invoices: GstInvoiceRow[];
};

function invoiceTaxSplit(
  invoice: {
    taxAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    isInterState: boolean;
  },
  businessState: string | null,
  businessGstin: string | null,
  customerState: string | null,
  customerGstin: string | null,
) {
  if (invoice.cgstAmount > 0 || invoice.sgstAmount > 0 || invoice.igstAmount > 0) {
    return {
      cgst: invoice.cgstAmount,
      sgst: invoice.sgstAmount,
      igst: invoice.igstAmount,
      isInterState: invoice.isInterState,
      supplyLabel: invoice.isInterState
        ? "Inter-state (IGST)"
        : "Intra-state (CGST + SGST)",
    };
  }

  const split = splitGstTax(
    invoice.taxAmount,
    businessState,
    customerState,
    businessGstin,
    customerGstin,
  );

  return {
    cgst: split.cgst,
    sgst: split.sgst,
    igst: split.igst,
    isInterState: split.isInterState,
    supplyLabel: split.isInterState
      ? "Inter-state (IGST)"
      : "Intra-state (CGST + SGST)",
  };
}

export async function getGstReportData(businessId: string): Promise<GstReportData> {
  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { gstin: true, state: true },
  });

  const businessState = resolvePartyState(business?.state, business?.gstin);
  const businessGstin = business?.gstin ?? null;

  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      status: { notIn: ["DRAFT", "CANCELLED"] },
    },
    include: {
      customer: {
        select: { name: true, state: true, gstin: true },
      },
    },
    orderBy: { issueDate: "desc" },
  });

  const monthlyMap = new Map<string, GstMonthlyRow>();
  const invoiceRows: GstInvoiceRow[] = [];

  let totalSales = 0;
  let totalTax = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let intraStateCount = 0;
  let interStateCount = 0;

  for (const invoice of invoices) {
    const tax = invoiceTaxSplit(
      invoice,
      businessState,
      businessGstin,
      invoice.customer.state,
      invoice.customer.gstin,
    );

    totalSales += invoice.subtotal;
    totalTax += invoice.taxAmount;
    totalCgst += tax.cgst;
    totalSgst += tax.sgst;
    totalIgst += tax.igst;

    if (tax.isInterState) interStateCount++;
    else intraStateCount++;

    const monthKey = `${invoice.issueDate.getFullYear()}-${String(
      invoice.issueDate.getMonth() + 1,
    ).padStart(2, "0")}`;

    const monthLabel = new Intl.DateTimeFormat("en-IN", {
      month: "short",
      year: "numeric",
    }).format(invoice.issueDate);

    const existing = monthlyMap.get(monthKey) ?? {
      month: monthKey,
      label: monthLabel,
      sales: 0,
      tax: 0,
      cgst: 0,
      sgst: 0,
      igst: 0,
      count: 0,
    };

    existing.sales += invoice.subtotal;
    existing.tax += invoice.taxAmount;
    existing.cgst += tax.cgst;
    existing.sgst += tax.sgst;
    existing.igst += tax.igst;
    existing.count += 1;
    monthlyMap.set(monthKey, existing);

    invoiceRows.push({
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customer.name,
      customerGstin: invoice.customer.gstin,
      issueDate: invoice.issueDate,
      status: invoice.status,
      subtotal: invoice.subtotal,
      taxAmount: invoice.taxAmount,
      cgst: tax.cgst,
      sgst: tax.sgst,
      igst: tax.igst,
      total: invoice.total,
      isInterState: tax.isInterState,
      supplyLabel: tax.supplyLabel,
    });
  }

  const monthly = Array.from(monthlyMap.values()).sort((a, b) =>
    b.month.localeCompare(a.month),
  );

  return {
    summary: {
      totalSales,
      totalTax,
      totalCgst,
      totalSgst,
      totalIgst,
      invoiceCount: invoices.length,
      intraStateCount,
      interStateCount,
      businessGstin,
      businessState,
    },
    monthly,
    invoices: invoiceRows,
  };
}
