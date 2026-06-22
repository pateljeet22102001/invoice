"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  postInvoiceReceiptJournal,
  postInvoiceSaleJournal,
  reverseInvoiceJournals,
  shouldPostSaleJournal,
} from "@/lib/accounting/journal";
import { AUDIT_ACTIONS, logAuditEvent } from "@/lib/accounting/audit-log";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import { splitGstTax } from "@/lib/gst";
import { roundQuantity } from "@/lib/constants/product-units";
import { parseTransportFromForm } from "@/lib/transport-fields";
import { getField, type FormState } from "@/lib/form";

type InvoiceLineInput = {
  productId: string;
  quantity: number;
};

function parseItems(raw: string): InvoiceLineInput[] | null {
  try {
    const parsed = JSON.parse(raw) as InvoiceLineInput[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed.filter(
      (item) =>
        typeof item.productId === "string" &&
        item.productId.length > 0 &&
        typeof item.quantity === "number" &&
        item.quantity > 0,
    );
  } catch {
    return null;
  }
}

async function generateInvoiceNumber(businessId: string) {
  const year = new Date().getFullYear();
  const prefix = `INV-${year}-`;

  const latest = await prisma.invoice.findFirst({
    where: { businessId, invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });

  const lastSequence = latest
    ? Number.parseInt(latest.invoiceNumber.replace(prefix, ""), 10)
    : 0;

  const next = Number.isFinite(lastSequence) ? lastSequence + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

type InvoiceJournalContext = {
  id: string;
  invoiceNumber: string;
  issueDate: Date;
  subtotal: number;
  total: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  status: string;
  items: { productId: string | null; quantity: number }[];
};

async function syncInvoiceAccounting(
  tx: unknown,
  businessId: string,
  invoice: InvoiceJournalContext,
  productMap: Map<string, { id: string; costPrice: number }>,
  previousStatus: string,
  nextStatus: string,
) {
  const journalInvoice = {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    issueDate: invoice.issueDate,
    subtotal: invoice.subtotal,
    total: invoice.total,
    cgstAmount: invoice.cgstAmount,
    sgstAmount: invoice.sgstAmount,
    igstAmount: invoice.igstAmount,
  };

  const wasPosted = shouldPostSaleJournal(previousStatus);
  const shouldPost = shouldPostSaleJournal(nextStatus);
  const wasPaid = previousStatus === "PAID";
  const isPaid = nextStatus === "PAID";

  if (wasPosted && !shouldPost) {
    await reverseInvoiceJournals(tx, businessId, journalInvoice);
    return;
  }

  if (!wasPosted && shouldPost) {
    await postInvoiceSaleJournal(
      tx,
      businessId,
      journalInvoice,
      invoice.items,
      productMap,
    );
  }

  if (wasPaid && !isPaid && shouldPost) {
    await reverseInvoiceJournals(tx, businessId, journalInvoice);
    await postInvoiceSaleJournal(
      tx,
      businessId,
      journalInvoice,
      invoice.items,
      productMap,
    );
  } else if (!wasPaid && isPaid && shouldPost) {
    await postInvoiceReceiptJournal(tx, businessId, journalInvoice);
  }
}

export async function createInvoiceAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { businessId, userName } = await requireBusiness();

  const customerId = getField(formData, "customerId");
  const invoiceType = getField(formData, "invoiceType") || "B2B";
  const issueDateRaw = getField(formData, "issueDate");
  const dueDateRaw = getField(formData, "dueDate");
  const status = getField(formData, "status") || "SENT";
  const notes = getField(formData, "notes");
  const items = parseItems(getField(formData, "items"));

  if (!customerId) {
    return { error: "Please select a customer." };
  }

  if (!issueDateRaw || !dueDateRaw) {
    return { error: "Issue date and due date are required." };
  }

  if (!items || items.length === 0) {
    return { error: "Add at least one product line to the invoice." };
  }

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId },
  });

  if (!customer) {
    return { error: "Selected customer was not found." };
  }

  if (invoiceType === "B2B" && !customer.gstin) {
    return {
      error:
        "B2B GST invoice requires customer GSTIN. Add GSTIN to the customer or use B2C mode.",
    };
  }

  const transportParsed = parseTransportFromForm(formData);
  if ("error" in transportParsed) {
    return { error: transportParsed.error };
  }
  const transport = transportParsed.data;

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { state: true, gstin: true },
  });

  if (!business) {
    return { error: "Business profile not found." };
  }

  const issueDate = new Date(issueDateRaw);
  const dueDate = new Date(dueDateRaw);

  if (Number.isNaN(issueDate.getTime()) || Number.isNaN(dueDate.getTime())) {
    return { error: "Enter valid dates." };
  }

  const productIds = items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { businessId, id: { in: productIds } },
    include: { inventory: true },
  });

  if (products.length !== new Set(productIds).size) {
    return { error: "One or more selected products are invalid." };
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  let subtotal = 0;
  let taxAmount = 0;
  const lineData: {
    productId: string;
    description: string;
    quantity: number;
    unitPrice: number;
    gstRate: number;
    total: number;
  }[] = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      return { error: "One or more selected products are invalid." };
    }

    const quantity = roundQuantity(item.quantity, product.unit);
    const available = product.inventory?.quantity ?? 0;

    if (quantity > available) {
      return {
        error: `Insufficient stock for ${product.name}. Available: ${available}`,
      };
    }

    const lineSubtotal = quantity * product.unitPrice;
    const lineTax = lineSubtotal * (product.gstRate / 100);

    subtotal += lineSubtotal;
    taxAmount += lineTax;

    lineData.push({
      productId: product.id,
      description: product.name,
      quantity,
      unitPrice: product.unitPrice,
      gstRate: product.gstRate,
      total: lineSubtotal,
    });
  }

  const total = subtotal + taxAmount;
  const taxRate = subtotal > 0 ? Math.round((taxAmount / subtotal) * 10000) / 100 : 0;
  const gstSplit = splitGstTax(
    taxAmount,
    business.state,
    customer.state,
    business.gstin,
    customer.gstin,
  );
  const invoiceNumber = await generateInvoiceNumber(businessId);

  let createdInvoiceId = "";

  try {
    await prisma.$transaction(async (tx) => {
      const invoice = (await tx.invoice.create({
        data: {
          businessId,
          invoiceNumber,
          invoiceType: invoiceType as "B2B" | "B2C",
          customerId,
          status: status as "DRAFT" | "SENT" | "PAID" | "OVERDUE" | "CANCELLED",
          issueDate,
          dueDate,
          subtotal,
          taxRate,
          taxAmount,
          cgstAmount: gstSplit.cgst,
          sgstAmount: gstSplit.sgst,
          igstAmount: gstSplit.igst,
          isInterState: gstSplit.isInterState,
          total,
          notes: notes || undefined,
          ...transport,
          items: { create: lineData },
        } as never,
        include: { items: true },
      })) as InvoiceJournalContext;

      createdInvoiceId = invoice.id;

      for (const item of items) {
        if (status === "DRAFT") break;

        const product = productMap.get(item.productId)!;
        if (product.inventory) {
          await tx.inventory.update({
            where: { productId: product.id },
            data: { quantity: { decrement: roundQuantity(item.quantity, product.unit) } },
          });
        }
      }

      const costMap = new Map(
        products.map((p) => [p.id, { id: p.id, costPrice: p.costPrice }]),
      );

      await syncInvoiceAccounting(
        tx,
        businessId,
        invoice,
        costMap,
        "DRAFT",
        status,
      );

      await logAuditEvent(tx, {
        businessId,
        action: AUDIT_ACTIONS.INVOICE_CREATED,
        entityType: "INVOICE",
        entityId: invoice.id,
        entityLabel: invoice.invoiceNumber,
        details: { status, total: invoice.total },
        performedBy: userName,
      });
    });
  } catch (error) {
    console.error(error);
    return { error: "Could not create invoice. Please try again." };
  }

  revalidatePath("/invoices");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/khata");
  revalidatePath("/accounting");
  revalidatePath("/accounting/journals");
  revalidatePath("/accounting/ca-reports");
  redirect(`/invoices/${createdInvoiceId}`);
}

export async function updateInvoiceAction(
  invoiceId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { businessId, userName } = await requireBusiness();

  const status = getField(formData, "status");
  const notes = getField(formData, "notes");
  const transportParsed = parseTransportFromForm(formData);
  if ("error" in transportParsed) {
    return { error: transportParsed.error };
  }
  const transport = transportParsed.data;

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, businessId },
    include: { items: true },
  });

  if (!invoice) {
    return { error: "Invoice not found." };
  }

  const validStatuses = ["DRAFT", "SENT", "PAID", "OVERDUE", "CANCELLED"];
  if (!validStatuses.includes(status)) {
    return { error: "Invalid invoice status." };
  }

  const previousStatus = invoice.status;
  const nextStatus = status as typeof invoice.status;
  const stockWasDeducted = previousStatus !== "DRAFT";
  const stockShouldBeDeducted = nextStatus !== "DRAFT" && nextStatus !== "CANCELLED";

  try {
    await prisma.$transaction(async (tx) => {
      if (stockWasDeducted && !stockShouldBeDeducted) {
        for (const item of invoice.items) {
          if (item.productId) {
            await tx.inventory.updateMany({
              where: { productId: item.productId },
              data: { quantity: { increment: item.quantity } },
            });
          }
        }
      }

      if (!stockWasDeducted && stockShouldBeDeducted) {
        for (const item of invoice.items) {
          if (!item.productId) continue;

          const inventory = await tx.inventory.findUnique({
            where: { productId: item.productId },
          });

          if (!inventory || inventory.quantity < item.quantity) {
            throw new Error(`Insufficient stock to mark invoice as ${nextStatus}.`);
          }

          await tx.inventory.update({
            where: { productId: item.productId },
            data: { quantity: { decrement: item.quantity } },
          });
        }
      }

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: nextStatus,
          notes: notes || null,
          ...transport,
        } as never,
      });

      const products = await tx.product.findMany({
        where: {
          businessId,
          id: {
            in: invoice.items
              .map((item) => item.productId)
              .filter((id): id is string => !!id),
          },
        },
        select: { id: true, costPrice: true },
      });
      const costMap = new Map(products.map((p) => [p.id, p]));

      await syncInvoiceAccounting(
        tx,
        businessId,
        invoice as InvoiceJournalContext,
        costMap,
        previousStatus,
        nextStatus,
      );

      await logAuditEvent(tx, {
        businessId,
        action: AUDIT_ACTIONS.INVOICE_UPDATED,
        entityType: "INVOICE",
        entityId: invoice.id,
        entityLabel: invoice.invoiceNumber,
        details: { from: previousStatus, to: nextStatus },
        performedBy: userName,
      });
    });
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Could not update invoice." };
  }

  revalidatePath("/invoices");
  revalidatePath(`/invoices/${invoiceId}`);
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/khata");
  revalidatePath("/accounting");
  revalidatePath("/accounting/journals");
  revalidatePath("/accounting/ca-reports");
  redirect(`/invoices/${invoiceId}`);
}

export async function deleteInvoiceAction(invoiceId: string): Promise<FormState> {
  const { businessId, userName } = await requireBusiness();

  const invoice = await prisma.invoice.findFirst({
    where: { id: invoiceId, businessId },
    include: { items: true },
  });

  if (!invoice) {
    return { error: "Invoice not found." };
  }

  await prisma.$transaction(async (tx) => {
    if (invoice.status !== "DRAFT" && invoice.status !== "CANCELLED") {
      for (const item of invoice.items) {
        if (item.productId) {
          await tx.inventory.updateMany({
            where: { productId: item.productId },
            data: { quantity: { increment: item.quantity } },
          });
        }
      }
    }

    if (invoice.status !== "DRAFT" && invoice.status !== "CANCELLED") {
      await reverseInvoiceJournals(tx, businessId, {
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        issueDate: invoice.issueDate,
        subtotal: invoice.subtotal,
        total: invoice.total,
        cgstAmount: invoice.cgstAmount,
        sgstAmount: invoice.sgstAmount,
        igstAmount: invoice.igstAmount,
      });
    }

    await logAuditEvent(tx, {
      businessId,
      action: AUDIT_ACTIONS.INVOICE_DELETED,
      entityType: "INVOICE",
      entityId: invoice.id,
      entityLabel: invoice.invoiceNumber,
      details: { status: invoice.status },
      performedBy: userName,
    });

    await tx.invoice.delete({ where: { id: invoiceId } });
  });

  revalidatePath("/invoices");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  revalidatePath("/reports");
  revalidatePath("/khata");
  revalidatePath("/accounting");
  revalidatePath("/accounting/journals");
  revalidatePath("/accounting/ledgers");
  revalidatePath("/accounting/ca-reports");
  redirect("/invoices");
}
