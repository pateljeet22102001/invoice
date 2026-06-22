import { prisma } from "@/lib/prisma";
import { resolvePartyState } from "@/lib/gst";

export type Gstr1B2BRow = {
  recipientGstin: string;
  recipientName: string;
  invoiceNumber: string;
  invoiceDate: string;
  invoiceValue: number;
  placeOfSupply: string;
  reverseCharge: string;
  invoiceType: string;
  rate: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  cess: number;
};

export type Gstr1Export = {
  period: string;
  periodLabel: string;
  businessGstin: string | null;
  b2b: Gstr1B2BRow[];
  b2cSummary: {
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
    invoiceCount: number;
  };
  hsnSummary: Array<{
    hsnCode: string;
    description: string;
    uqc: string;
    quantity: number;
    taxableValue: number;
    cgst: number;
    sgst: number;
    igst: number;
  }>;
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

export async function buildGstr1Export(
  businessId: string,
  yearMonth: string,
): Promise<Gstr1Export> {
  const { start, end, label } = monthBounds(yearMonth);

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { gstin: true, state: true },
  });

  const invoices = await prisma.invoice.findMany({
    where: {
      businessId,
      status: { notIn: ["DRAFT", "CANCELLED"] },
      issueDate: { gte: start, lte: end },
    },
    include: {
      customer: { select: { name: true, gstin: true, state: true } },
      items: { include: { product: { select: { hsnCode: true, unit: true, name: true } } } },
    },
    orderBy: { issueDate: "asc" },
  });

  const b2b: Gstr1B2BRow[] = [];
  let b2cTaxable = 0;
  let b2cCgst = 0;
  let b2cSgst = 0;
  let b2cIgst = 0;
  let b2cCount = 0;

  const hsnMap = new Map<
    string,
    {
      hsnCode: string;
      description: string;
      uqc: string;
      quantity: number;
      taxableValue: number;
      cgst: number;
      sgst: number;
      igst: number;
    }
  >();

  for (const invoice of invoices) {
    const placeOfSupply =
      resolvePartyState(invoice.customer.state, invoice.customer.gstin) ??
      invoice.customer.state ??
      "";

    if (invoice.invoiceType === "B2B" && invoice.customer.gstin) {
      const effectiveRate =
        invoice.subtotal > 0
          ? Math.round((invoice.taxAmount / invoice.subtotal) * 10000) / 100
          : invoice.taxRate;

      b2b.push({
        recipientGstin: invoice.customer.gstin,
        recipientName: invoice.customer.name,
        invoiceNumber: invoice.invoiceNumber,
        invoiceDate: formatGstDate(invoice.issueDate),
        invoiceValue: invoice.total,
        placeOfSupply,
        reverseCharge: "N",
        invoiceType: "Regular",
        rate: effectiveRate,
        taxableValue: invoice.subtotal,
        cgst: invoice.cgstAmount,
        sgst: invoice.sgstAmount,
        igst: invoice.igstAmount,
        cess: 0,
      });
    } else {
      b2cTaxable += invoice.subtotal;
      b2cCgst += invoice.cgstAmount;
      b2cSgst += invoice.sgstAmount;
      b2cIgst += invoice.igstAmount;
      b2cCount += 1;
    }

    for (const item of invoice.items) {
      const hsn = item.product?.hsnCode ?? "9997";
      const key = `${hsn}-${item.gstRate}`;
      const lineTax = item.total * (item.gstRate / 100);
      const lineCgst = invoice.isInterState ? 0 : lineTax / 2;
      const lineSgst = invoice.isInterState ? 0 : lineTax / 2;
      const lineIgst = invoice.isInterState ? lineTax : 0;
      const uqc = item.product?.unit === "kg" ? "KGS" : "PCS";

      const existing = hsnMap.get(key) ?? {
        hsnCode: hsn,
        description: item.product?.name ?? item.description,
        uqc,
        quantity: 0,
        taxableValue: 0,
        cgst: 0,
        sgst: 0,
        igst: 0,
      };

      existing.quantity += item.quantity;
      existing.taxableValue += item.total;
      existing.cgst += lineCgst;
      existing.sgst += lineSgst;
      existing.igst += lineIgst;
      hsnMap.set(key, existing);
    }
  }

  return {
    period: yearMonth,
    periodLabel: label,
    businessGstin: business?.gstin ?? null,
    b2b,
    b2cSummary: {
      taxableValue: Math.round(b2cTaxable * 100) / 100,
      cgst: Math.round(b2cCgst * 100) / 100,
      sgst: Math.round(b2cSgst * 100) / 100,
      igst: Math.round(b2cIgst * 100) / 100,
      invoiceCount: b2cCount,
    },
    hsnSummary: Array.from(hsnMap.values()).sort((a, b) =>
      a.hsnCode.localeCompare(b.hsnCode),
    ),
  };
}

export function gstr1B2bToCsv(rows: Gstr1B2BRow[]) {
  const header = [
    "GSTIN/UIN of Recipient",
    "Receiver Name",
    "Invoice Number",
    "Invoice Date",
    "Invoice Value",
    "Place of Supply",
    "Reverse Charge",
    "Invoice Type",
    "Rate",
    "Taxable Value",
    "CGST",
    "SGST",
    "IGST",
    "Cess",
  ];

  const lines = [header.join(",")];

  for (const row of rows) {
    lines.push(
      [
        row.recipientGstin,
        `"${row.recipientName.replace(/"/g, '""')}"`,
        row.invoiceNumber,
        row.invoiceDate,
        row.invoiceValue.toFixed(2),
        `"${row.placeOfSupply}"`,
        row.reverseCharge,
        row.invoiceType,
        row.rate.toFixed(2),
        row.taxableValue.toFixed(2),
        row.cgst.toFixed(2),
        row.sgst.toFixed(2),
        row.igst.toFixed(2),
        row.cess.toFixed(2),
      ].join(","),
    );
  }

  return lines.join("\n");
}

export function gstr1HsnToCsv(
  rows: Gstr1Export["hsnSummary"],
) {
  const header = [
    "HSN",
    "Description",
    "UQC",
    "Total Quantity",
    "Taxable Value",
    "CGST",
    "SGST",
    "IGST",
  ];

  const lines = [header.join(",")];

  for (const row of rows) {
    lines.push(
      [
        row.hsnCode,
        `"${row.description.replace(/"/g, '""')}"`,
        row.uqc,
        row.quantity.toFixed(3),
        row.taxableValue.toFixed(2),
        row.cgst.toFixed(2),
        row.sgst.toFixed(2),
        row.igst.toFixed(2),
      ].join(","),
    );
  }

  return lines.join("\n");
}
