"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  postPurchaseBillJournal,
  postPurchasePaymentJournal,
  reversePurchaseJournals,
  shouldPostPurchaseJournal,
} from "@/lib/accounting/journal";
import { AUDIT_ACTIONS, logAuditEvent } from "@/lib/accounting/audit-log";
import { getPurchaseDb, getSupplierDb } from "@/lib/prisma-purchase";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import { splitGstTax } from "@/lib/gst";
import { roundQuantity } from "@/lib/constants/product-units";
import { findOrCreateProductForPurchase } from "@/lib/products/ensure-product";
import { findOrCreateSupplierForPurchase } from "@/lib/suppliers/ensure-supplier";
import { getField, getNumber, type FormState } from "@/lib/form";

type PurchaseLineInput = {
  productId?: string;
  newProductName?: string;
  unitPrice?: number;
  gstRate?: number;
  quantity: number;
  unitCost: number;
};

function parseItems(raw: string): PurchaseLineInput[] | null {
  try {
    const parsed = JSON.parse(raw) as PurchaseLineInput[];
    if (!Array.isArray(parsed) || parsed.length === 0) return null;
    return parsed.filter((item) => {
      if (typeof item.quantity !== "number" || item.quantity <= 0) return false;
      if (typeof item.unitCost !== "number" || item.unitCost < 0) return false;
      const hasProduct = typeof item.productId === "string" && item.productId.length > 0;
      const hasNewName =
        typeof item.newProductName === "string" && item.newProductName.trim().length > 0;
      return hasProduct || hasNewName;
    });
  } catch {
    return null;
  }
}

async function generatePurchaseNumber(businessId: string) {
  const year = new Date().getFullYear();
  const prefix = `PUR-${year}-`;

  const latest = (await getPurchaseDb(prisma).findFirst({
    where: { businessId, purchaseNumber: { startsWith: prefix } },
    orderBy: { purchaseNumber: "desc" },
    select: { purchaseNumber: true },
  })) as { purchaseNumber: string } | null;

  const lastSequence = latest
    ? Number.parseInt(latest.purchaseNumber.replace(prefix, ""), 10)
    : 0;

  const next = Number.isFinite(lastSequence) ? lastSequence + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

type PurchaseJournalContext = {
  id: string;
  purchaseNumber: string;
  billDate: Date;
  subtotal: number;
  total: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  commissionAmount?: number;
  status: string;
  items: { productId: string | null; quantity: number; unitCost: number }[];
};

async function addStockForPurchase(
  tx: unknown,
  items: { productId: string | null; quantity: number; unitCost: number }[],
) {
  const db = tx as typeof prisma;

  for (const item of items) {
    if (!item.productId) continue;

    const existing = await db.inventory.findUnique({
      where: { productId: item.productId },
    });

    if (existing) {
      await db.inventory.update({
        where: { productId: item.productId },
        data: { quantity: { increment: item.quantity } },
      });
    } else {
      await db.inventory.create({
        data: {
          productId: item.productId,
          quantity: item.quantity,
          lowStockThreshold: 10,
        },
      });
    }

    await db.product.update({
      where: { id: item.productId },
      data: { costPrice: item.unitCost },
    });
  }
}

async function removeStockForPurchase(
  tx: unknown,
  items: { productId: string | null; quantity: number }[],
) {
  const db = tx as typeof prisma;

  for (const item of items) {
    if (!item.productId) continue;

    await db.inventory.updateMany({
      where: { productId: item.productId },
      data: { quantity: { decrement: item.quantity } },
    });
  }
}

async function syncPurchaseAccounting(
  tx: unknown,
  businessId: string,
  purchase: PurchaseJournalContext,
  previousStatus: string,
  nextStatus: string,
) {
  const journalPurchase = {
    id: purchase.id,
    purchaseNumber: purchase.purchaseNumber,
    billDate: purchase.billDate,
    subtotal: purchase.subtotal,
    total: purchase.total,
    cgstAmount: purchase.cgstAmount,
    sgstAmount: purchase.sgstAmount,
    igstAmount: purchase.igstAmount,
    commissionAmount: purchase.commissionAmount ?? 0,
  };

  const wasPosted = shouldPostPurchaseJournal(previousStatus);
  const shouldPost = shouldPostPurchaseJournal(nextStatus);
  const wasPaid = previousStatus === "PAID";
  const isPaid = nextStatus === "PAID";

  if (wasPosted && !shouldPost) {
    await reversePurchaseJournals(tx, businessId, journalPurchase);
    return;
  }

  if (!wasPosted && shouldPost) {
    await postPurchaseBillJournal(tx, businessId, journalPurchase);
  }

  if (wasPaid && !isPaid && shouldPost) {
    await reversePurchaseJournals(tx, businessId, journalPurchase);
    await postPurchaseBillJournal(tx, businessId, journalPurchase);
  } else if (!wasPaid && isPaid && shouldPost) {
    await postPurchasePaymentJournal(tx, businessId, journalPurchase);
  }
}

export async function createPurchaseAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { businessId, userName } = await requireBusiness();

  const supplierIdRaw = getField(formData, "supplierId");
  const newSupplierName = getField(formData, "newSupplierName");
  const newSupplierVillage = getField(formData, "newSupplierVillage");
  const purchaseType = getField(formData, "purchaseType") || "B2B";
  const commissionAgentId = getField(formData, "commissionAgentId");
  const commissionRateRaw = getField(formData, "commissionRate");
  const billDateRaw = getField(formData, "billDate");
  const dueDateRaw = getField(formData, "dueDate");
  const paymentMode = getField(formData, "paymentMode") || "CASH";
  const chequeNumber = getField(formData, "chequeNumber");
  const status = getField(formData, "status") || "RECEIVED";
  const notes = getField(formData, "notes");
  const items = parseItems(getField(formData, "items"));

  if (!items || items.length === 0) {
    return { error: "Add at least one product line to the purchase bill." };
  }

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { state: true, gstin: true, commissionRate: true, businessType: true },
  });

  if (!business) {
    return { error: "Business profile not found." };
  }

  const inlineSupplierAllowed = ["FARMER", "UNREGISTERED", "APMC_MANDI"].includes(
    purchaseType,
  );

  let supplierId = supplierIdRaw;

  if (newSupplierName.trim()) {
    if (!inlineSupplierAllowed) {
      return {
        error: "Type a new party name only for farmer or unregistered purchases.",
      };
    }

    try {
      supplierId = await findOrCreateSupplierForPurchase(prisma, businessId, {
        name: newSupplierName,
        purchaseType,
        state: business.state,
        village: newSupplierVillage || undefined,
      });
    } catch (error) {
      if (error instanceof Error) {
        return { error: error.message };
      }
      return { error: "Could not save farmer or supplier name." };
    }
  }

  if (!supplierId) {
    return { error: "Select or type farmer / supplier name." };
  }

  const supplier = (await getSupplierDb(prisma).findFirst({
    where: { id: supplierId, businessId },
  })) as {
    id: string;
    state: string | null;
    gstin: string | null;
    supplierType: string;
  } | null;

  if (!supplier) {
    return { error: "Selected supplier was not found." };
  }

  const businessType = business.businessType ?? "GENERAL_TRADING";

  if (!billDateRaw) {
    return { error: "Bill date is required." };
  }

  const billDate = new Date(billDateRaw);
  if (Number.isNaN(billDate.getTime())) {
    return { error: "Enter a valid bill date." };
  }

  let dueDate: Date;

  if (paymentMode === "CASH") {
    dueDate = billDate;
  } else if (paymentMode === "CHEQUE") {
    if (!chequeNumber.trim()) {
      return { error: "Enter cheque number." };
    }
    if (!dueDateRaw) {
      return { error: "Enter cheque due date." };
    }
    dueDate = new Date(dueDateRaw);
    if (Number.isNaN(dueDate.getTime())) {
      return { error: "Enter a valid cheque due date." };
    }
  } else if (paymentMode === "CREDIT") {
    if (!dueDateRaw) {
      return { error: "Enter pay-by date for credit." };
    }
    dueDate = new Date(dueDateRaw);
    if (Number.isNaN(dueDate.getTime())) {
      return { error: "Enter a valid pay-by date." };
    }
  } else {
    return { error: "Select a payment mode." };
  }

  let subtotal = 0;
  let taxAmount = 0;
  const lineData: {
    productId: string;
    description: string;
    quantity: number;
    unitCost: number;
    gstRate: number;
    total: number;
  }[] = [];

  const resolvedItems: Array<{
    productId: string;
    quantity: number;
    unitCost: number;
    gstRate: number;
    name: string;
    unit: string;
  }> = [];

  try {
    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        let productId = item.productId;
        let product: {
          id: string;
          name: string;
          unit: string;
          gstRate: number;
        } | null = null;

        if (item.newProductName?.trim()) {
          const saleRate =
            typeof item.unitPrice === "number" && item.unitPrice >= 0
              ? item.unitPrice
              : item.unitCost;
          productId = await findOrCreateProductForPurchase(tx, businessId, businessType, {
            name: item.newProductName.trim(),
            unitCost: item.unitCost,
            unitPrice: saleRate,
            gstRate: item.gstRate ?? 5,
            unit: "kg",
          });
        }

        if (!productId) {
          throw new Error("Each line needs an item name or existing product.");
        }

        product = await tx.product.findFirst({
          where: { id: productId, businessId },
          select: { id: true, name: true, unit: true, gstRate: true },
        });

        if (!product) {
          throw new Error("One or more items are invalid.");
        }

        const quantity = roundQuantity(item.quantity, product.unit);
        const unitCost = Math.round(item.unitCost * 100) / 100;
        const effectiveGstRate = item.gstRate ?? product.gstRate;

        resolvedItems.push({
          productId: product.id,
          quantity,
          unitCost,
          gstRate: effectiveGstRate,
          name: product.name,
          unit: product.unit,
        });
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Could not save item names." };
  }

  for (const item of resolvedItems) {
    const lineSubtotal = item.quantity * item.unitCost;
    const lineTax = lineSubtotal * (item.gstRate / 100);
    subtotal += lineSubtotal;
    taxAmount += lineTax;

    lineData.push({
      productId: item.productId,
      description: item.name,
      quantity: item.quantity,
      unitCost: item.unitCost,
      gstRate: item.gstRate,
      total: lineSubtotal,
    });
  }

  if (purchaseType === "B2B" && !supplier.gstin) {
    return {
      error:
        "B2B purchase requires supplier GSTIN for input tax credit. Add GSTIN or use Farmer/Unregistered type.",
    };
  }

  let commissionAgent: { id: string } | null = null;
  let commissionRate = 0;
  let commissionAmount = 0;

  if (purchaseType === "APMC_MANDI") {
    if (!commissionAgentId) {
      return { error: "Select APMC commission agent for market purchase." };
    }

    commissionAgent = (await getSupplierDb(prisma).findFirst({
      where: { id: commissionAgentId, businessId, supplierType: "APMC_AGENT" },
      select: { id: true },
    })) as { id: string } | null;

    if (!commissionAgent) {
      return {
        error: "Commission agent not found. Add an APMC agent in Suppliers first.",
      };
    }

    commissionRate = commissionRateRaw
      ? getNumber(formData, "commissionRate")
      : business.commissionRate ?? 0;

    if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 100) {
      return { error: "Enter a valid commission rate (0–100%)." };
    }
  }

  if (purchaseType === "APMC_MANDI" && subtotal > 0 && commissionRate > 0) {
    commissionAmount = Math.round(subtotal * (commissionRate / 100) * 100) / 100;
  }

  const total = subtotal + taxAmount + commissionAmount;
  const taxRate = subtotal > 0 ? Math.round((taxAmount / subtotal) * 10000) / 100 : 0;
  const gstSplit = splitGstTax(
    taxAmount,
    business.state,
    supplier.state,
    business.gstin,
    supplier.gstin,
  );
  const purchaseNumber = await generatePurchaseNumber(businessId);

  let createdPurchaseId = "";

  try {
    await prisma.$transaction(async (tx) => {
      const purchase = (await getPurchaseDb(tx).create({
        data: {
          businessId,
          purchaseNumber,
          purchaseType: purchaseType as "B2B" | "FARMER" | "UNREGISTERED" | "APMC_MANDI",
          supplierId,
          commissionAgentId: commissionAgent?.id ?? undefined,
          commissionRate: purchaseType === "APMC_MANDI" ? commissionRate : undefined,
          commissionAmount,
          status: status as "DRAFT" | "RECEIVED" | "PAID" | "CANCELLED",
          paymentMode: paymentMode as "CASH" | "CHEQUE" | "CREDIT",
          chequeNumber:
            paymentMode === "CHEQUE" ? chequeNumber.trim() : undefined,
          billDate,
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
          items: { create: lineData },
        },
        include: { items: true },
      })) as PurchaseJournalContext;

      createdPurchaseId = purchase.id;

      if (status !== "DRAFT" && status !== "CANCELLED") {
        await addStockForPurchase(tx, purchase.items);
      }

      await syncPurchaseAccounting(tx, businessId, purchase, "DRAFT", status);

      await logAuditEvent(tx, {
        businessId,
        action: AUDIT_ACTIONS.PURCHASE_CREATED,
        entityType: "PURCHASE",
        entityId: purchase.id,
        entityLabel: purchase.purchaseNumber,
        details: { status, total: purchase.total, purchaseType },
        performedBy: userName,
      });
    });
  } catch (error) {
    console.error(error);
    return { error: "Could not create purchase bill. Please try again." };
  }

  revalidatePath("/purchases");
  revalidatePath("/inventory");
  revalidatePath("/products");
  revalidatePath("/dashboard");
  revalidatePath("/suppliers");
  revalidatePath("/khata");
  revalidatePath("/accounting");
  revalidatePath("/accounting/journals");
  revalidatePath("/accounting/ca-reports");
  redirect(`/purchases/${createdPurchaseId}`);
}

export async function updatePurchaseAction(
  purchaseId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { businessId, userName } = await requireBusiness();

  const status = getField(formData, "status");
  const notes = getField(formData, "notes");

  const purchase = (await getPurchaseDb(prisma).findFirst({
    where: { id: purchaseId, businessId },
    include: { items: true },
  })) as PurchaseJournalContext | null;

  if (!purchase) {
    return { error: "Purchase bill not found." };
  }

  const validStatuses = ["DRAFT", "RECEIVED", "PAID", "CANCELLED"];
  if (!validStatuses.includes(status)) {
    return { error: "Invalid purchase status." };
  }

  const previousStatus = purchase.status;
  const nextStatus = status;
  const stockWasAdded =
    previousStatus !== "DRAFT" && previousStatus !== "CANCELLED";
  const stockShouldBeAdded =
    nextStatus !== "DRAFT" && nextStatus !== "CANCELLED";

  try {
    await prisma.$transaction(async (tx) => {
      if (stockWasAdded && !stockShouldBeAdded) {
        await removeStockForPurchase(tx, purchase.items);
      }

      if (!stockWasAdded && stockShouldBeAdded) {
        await addStockForPurchase(tx, purchase.items);
      }

      await getPurchaseDb(tx).update({
        where: { id: purchaseId },
        data: {
          status: nextStatus as "DRAFT" | "RECEIVED" | "PAID" | "CANCELLED",
          notes: notes || null,
        },
      });

      const updatedPurchase = { ...purchase, status: nextStatus };

      await syncPurchaseAccounting(
        tx,
        businessId,
        updatedPurchase,
        previousStatus,
        nextStatus,
      );

      await logAuditEvent(tx, {
        businessId,
        action: AUDIT_ACTIONS.PURCHASE_UPDATED,
        entityType: "PURCHASE",
        entityId: purchase.id,
        entityLabel: purchase.purchaseNumber,
        details: { from: previousStatus, to: nextStatus },
        performedBy: userName,
      });
    });
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Could not update purchase bill." };
  }

  revalidatePath("/purchases");
  revalidatePath(`/purchases/${purchaseId}`);
  revalidatePath("/inventory");
  revalidatePath("/products");
  revalidatePath("/suppliers");
  revalidatePath("/khata");
  revalidatePath("/accounting");
  revalidatePath("/accounting/journals");
  revalidatePath("/accounting/ca-reports");
  redirect(`/purchases/${purchaseId}`);
}

export async function deletePurchaseAction(
  purchaseId: string,
): Promise<FormState> {
  const { businessId, userName } = await requireBusiness();

  const purchase = (await getPurchaseDb(prisma).findFirst({
    where: { id: purchaseId, businessId },
    include: { items: true },
  })) as PurchaseJournalContext | null;

  if (!purchase) {
    return { error: "Purchase bill not found." };
  }

  await prisma.$transaction(async (tx) => {
    if (purchase.status !== "DRAFT" && purchase.status !== "CANCELLED") {
      await removeStockForPurchase(tx, purchase.items);
    }

    if (shouldPostPurchaseJournal(purchase.status)) {
      await reversePurchaseJournals(tx, businessId, {
        id: purchase.id,
        purchaseNumber: purchase.purchaseNumber,
        billDate: purchase.billDate,
        subtotal: purchase.subtotal,
        total: purchase.total,
        cgstAmount: purchase.cgstAmount,
        sgstAmount: purchase.sgstAmount,
        igstAmount: purchase.igstAmount,
        commissionAmount: (purchase as { commissionAmount?: number }).commissionAmount ?? 0,
      });
    }

    await logAuditEvent(tx, {
      businessId,
      action: AUDIT_ACTIONS.PURCHASE_DELETED,
      entityType: "PURCHASE",
      entityId: purchase.id,
      entityLabel: purchase.purchaseNumber,
      details: { status: purchase.status },
      performedBy: userName,
    });

    await getPurchaseDb(tx).delete({ where: { id: purchaseId } });
  });

  revalidatePath("/purchases");
  revalidatePath("/inventory");
  revalidatePath("/products");
  revalidatePath("/suppliers");
  revalidatePath("/khata");
  revalidatePath("/accounting");
  revalidatePath("/accounting/journals");
  revalidatePath("/accounting/ca-reports");
  redirect("/purchases");
}
