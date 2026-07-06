import { getPurchaseDb } from "@/lib/prisma-purchase";
import { prisma } from "@/lib/prisma";
import { resolvePartyState, splitGstTax } from "@/lib/gst";

export type Gstr2BRow = {
  supplierGstin: string;
  supplierName: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceValue: number;
  placeOfSupply: string;
  reverseCharge: string;
  invoiceType: string;
  rate: number;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  cess: number;
  source: string;
};

export type Gstr2BExport = {
  period: string;
  periodLabel: string;
  businessGstin: string | null;
  inwardSupplies: Gstr2BRow[];
};

function formatGstDate(date: Date) {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const y = date.getFullYear();
  return `${d}-${m}-${y}`;
}

function monthBounds(yearMonth: string) {
  const [year, month] = yearMonth.split("-").map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  const label = new Intl.DateTimeFormat("en-IN", {
    month: "long",
    year: "numeric",
  }).format(start);
  return { start, end, label };
}

export async function buildGstr2bExport(
  businessId: string,
  yearMonth: string,
): Promise<Gstr2BExport> {
  const { start, end, label } = monthBounds(yearMonth);

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { gstin: true, state: true },
  });

  const purchases = (await getPurchaseDb(prisma).findMany({
    where: {
      businessId,
      status: { notIn: ["DRAFT", "CANCELLED"] },
      billDate: { gte: start, lte: end },
      purchaseType: { in: ["B2B", "APMC_MANDI"] },
    },
    include: {
      supplier: { select: { name: true, gstin: true, state: true } },
      commissionAgent: { select: { name: true, gstin: true, state: true } },
      items: { include: { product: { select: { hsnCode: true } } } },
    },
    orderBy: { billDate: "asc" },
  })) as Array<{
    purchaseType: string;
    purchaseNumber: string;
    supplierInvoiceNo: string | null;
    commissionAgentInvoiceNo: string | null;
    billDate: Date;
    subtotal: number;
    taxAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    igstAmount: number;
    total: number;
    commissionAmount: number;
    isInterState: boolean;
    supplier: { name: string; gstin: string | null; state: string | null };
    commissionAgent: { name: string; gstin: string | null; state: string | null } | null;
  }>;

  const inwardSupplies: Gstr2BRow[] = [];

  for (const purchase of purchases) {
    const invoiceNumber =
      purchase.supplierInvoiceNo?.trim() || purchase.purchaseNumber;
    const placeOfSupply =
      resolvePartyState(purchase.supplier.state, purchase.supplier.gstin) ?? "";

    if (purchase.purchaseType === "B2B" && purchase.supplier.gstin) {
      const effectiveRate =
        purchase.subtotal > 0
          ? Math.round((purchase.taxAmount / purchase.subtotal) * 10000) / 100
          : 0;

      inwardSupplies.push({
        supplierGstin: purchase.supplier.gstin,
        supplierName: purchase.supplier.name,
        invoiceNumber,
        invoiceDate: formatGstDate(purchase.billDate),
        invoiceValue: purchase.total,
        placeOfSupply,
        reverseCharge: "N",
        invoiceType: "Regular",
        rate: effectiveRate,
        taxableValue: purchase.subtotal,
        igst: purchase.igstAmount,
        cgst: purchase.cgstAmount,
        sgst: purchase.sgstAmount,
        cess: 0,
        source: "B2B Purchase",
      });
    }

    if (
      purchase.purchaseType === "APMC_MANDI" &&
      purchase.supplier.gstin &&
      purchase.supplierInvoiceNo?.trim()
    ) {
      const effectiveRate =
        purchase.subtotal > 0
          ? Math.round((purchase.taxAmount / purchase.subtotal) * 10000) / 100
          : 0;

      inwardSupplies.push({
        supplierGstin: purchase.supplier.gstin,
        supplierName: purchase.supplier.name,
        invoiceNumber: purchase.supplierInvoiceNo.trim(),
        invoiceDate: formatGstDate(purchase.billDate),
        invoiceValue: purchase.subtotal + purchase.taxAmount,
        placeOfSupply,
        reverseCharge: "N",
        invoiceType: "Regular",
        rate: effectiveRate,
        taxableValue: purchase.subtotal,
        igst: purchase.igstAmount,
        cgst: purchase.cgstAmount,
        sgst: purchase.sgstAmount,
        cess: 0,
        source: "Mandi seller",
      });
    }

    const agentInvoiceNo =
      purchase.commissionAgentInvoiceNo?.trim() ||
      purchase.supplierInvoiceNo?.trim();

    if (
      purchase.commissionAgent?.gstin &&
      agentInvoiceNo &&
      purchase.commissionAmount > 0
    ) {
      const agent = purchase.commissionAgent;
      const agentGstin = agent.gstin as string;
      const commissionTaxable = purchase.commissionAmount;
      const commissionGst = splitGstTax(
        commissionTaxable * 0.18,
        business?.state,
        agent.state,
        business?.gstin,
        agentGstin,
      );

      inwardSupplies.push({
        supplierGstin: agentGstin,
        supplierName: agent.name,
        invoiceNumber: agentInvoiceNo,
        invoiceDate: formatGstDate(purchase.billDate),
        invoiceValue:
          Math.round((commissionTaxable + commissionTaxable * 0.18) * 100) / 100,
        placeOfSupply:
          resolvePartyState(agent.state, agent.gstin) ?? agent.state ?? "",
        reverseCharge: "N",
        invoiceType: "Regular",
        rate: 18,
        taxableValue: commissionTaxable,
        igst: commissionGst.igst,
        cgst: commissionGst.cgst,
        sgst: commissionGst.sgst,
        cess: 0,
        source: "Mandi commission",
      });
    }
  }

  return {
    period: yearMonth,
    periodLabel: label,
    businessGstin: business?.gstin ?? null,
    inwardSupplies,
  };
}

export function gstr2bToCsv(rows: Gstr2BRow[]) {
  const header = [
    "GSTIN of Supplier",
    "Supplier Name",
    "Invoice Number",
    "Invoice Date",
    "Invoice Value",
    "Place of Supply",
    "Reverse Charge",
    "Invoice Type",
    "Rate",
    "Taxable Value",
    "Integrated Tax",
    "Central Tax",
    "State/UT Tax",
    "Cess",
    "Source",
  ];

  const lines = [header.join(",")];

  for (const row of rows) {
    lines.push(
      [
        row.supplierGstin,
        `"${row.supplierName.replace(/"/g, '""')}"`,
        row.invoiceNumber,
        row.invoiceDate,
        row.invoiceValue.toFixed(2),
        `"${row.placeOfSupply.replace(/"/g, '""')}"`,
        row.reverseCharge,
        row.invoiceType,
        row.rate.toFixed(2),
        row.taxableValue.toFixed(2),
        row.igst.toFixed(2),
        row.cgst.toFixed(2),
        row.sgst.toFixed(2),
        row.cess.toFixed(2),
        row.source,
      ].join(","),
    );
  }

  return lines.join("\n");
}
