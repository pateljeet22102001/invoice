"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getChallanDb, challanDb } from "@/lib/prisma-challan";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import { getField, type FormState } from "@/lib/form";
import { parseTransportFromForm } from "@/lib/transport-fields";
import { roundQuantity } from "@/lib/constants/product-units";

type ChallanLineInput = {
  productId: string;
  quantity: number;
};

function parseItems(raw: string): ChallanLineInput[] | null {
  try {
    const parsed = JSON.parse(raw) as ChallanLineInput[];
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

async function generateChallanNumber(businessId: string) {
  const year = new Date().getFullYear();
  const prefix = `DC-${year}-`;

  const latest = (await challanDb.findFirst({
    where: { businessId, challanNumber: { startsWith: prefix } },
    orderBy: { challanNumber: "desc" },
    select: { challanNumber: true },
  })) as { challanNumber: string } | null;

  const lastSequence = latest
    ? Number.parseInt(latest.challanNumber.replace(prefix, ""), 10)
    : 0;

  const next = Number.isFinite(lastSequence) ? lastSequence + 1 : 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

function transportFields(formData: FormData) {
  const parsed = parseTransportFromForm(formData);
  if ("error" in parsed) {
    throw new Error(parsed.error);
  }
  return parsed.data;
}

export async function createChallanAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { businessId } = await requireBusiness();

  const customerId = getField(formData, "customerId");
  const purpose = getField(formData, "purpose") || "STOCK_TRANSFER";
  const status = getField(formData, "status") || "DISPATCHED";
  const issueDateRaw = getField(formData, "issueDate");
  const notes = getField(formData, "notes");
  const items = parseItems(getField(formData, "items"));

  if (!customerId) {
    return { error: "Please select the receiving business." };
  }

  if (!issueDateRaw) {
    return { error: "Issue date is required." };
  }

  if (!items || items.length === 0) {
    return { error: "Add at least one product line." };
  }

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId },
  });

  if (!customer) {
    return { error: "Selected customer was not found." };
  }

  const issueDate = new Date(issueDateRaw);
  if (Number.isNaN(issueDate.getTime())) {
    return { error: "Enter a valid issue date." };
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
  const lineData: {
    productId: string;
    description: string;
    quantity: number;
    hsnCode: string | undefined;
  }[] = [];

  for (const item of items) {
    const product = productMap.get(item.productId);
    if (!product) {
      return { error: "One or more selected products are invalid." };
    }

    const quantity = roundQuantity(item.quantity, product.unit);
    const available = product.inventory?.quantity ?? 0;

    if (status !== "DRAFT" && quantity > available) {
      return {
        error: `Insufficient stock for ${product.name}. Available: ${available}`,
      };
    }

    lineData.push({
      productId: product.id,
      description: product.name,
      quantity,
      hsnCode: product.hsnCode ?? undefined,
    });
  }

  const challanNumber = await generateChallanNumber(businessId);
  let transport;
  try {
    transport = transportFields(formData);
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: "Invalid transport details." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      await getChallanDb(tx).create({
        data: {
          businessId,
          challanNumber,
          customerId,
          purpose: purpose as
            | "STOCK_TRANSFER"
            | "JOB_WORK"
            | "SALE_ON_APPROVAL"
            | "OTHER",
          status: status as "DRAFT" | "DISPATCHED" | "DELIVERED" | "CANCELLED",
          issueDate,
          notes: notes || undefined,
          ...transport,
          items: { create: lineData },
        },
      });

      if (status !== "DRAFT") {
        for (const item of items) {
          const product = productMap.get(item.productId)!;
          if (product.inventory) {
            await tx.inventory.update({
              where: { productId: product.id },
              data: { quantity: { decrement: roundQuantity(item.quantity, product.unit) } },
            });
          }
        }
      }
    });
  } catch (error) {
    console.error(error);
    return { error: "Could not create delivery challan." };
  }

  revalidatePath("/challans");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  redirect("/challans");
}

export async function updateChallanAction(
  challanId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { businessId } = await requireBusiness();

  const status = getField(formData, "status");
  const notes = getField(formData, "notes");
  let transport;
  try {
    transport = transportFields(formData);
  } catch (error) {
    if (error instanceof Error) return { error: error.message };
    return { error: "Invalid transport details." };
  }

  const challan = (await challanDb.findFirst({
    where: { id: challanId, businessId },
    include: { items: true },
  })) as {
    id: string;
    status: string;
    items: { productId: string | null; quantity: number }[];
  } | null;

  if (!challan) {
    return { error: "Delivery challan not found." };
  }

  const validStatuses = ["DRAFT", "DISPATCHED", "DELIVERED", "CANCELLED"];
  if (!validStatuses.includes(status)) {
    return { error: "Invalid challan status." };
  }

  const previousStatus = challan.status;
  const nextStatus = status as "DRAFT" | "DISPATCHED" | "DELIVERED" | "CANCELLED";
  const stockWasDeducted = previousStatus !== "DRAFT" && previousStatus !== "CANCELLED";
  const stockShouldBeDeducted = nextStatus !== "DRAFT" && nextStatus !== "CANCELLED";

  try {
    await prisma.$transaction(async (tx) => {
      if (stockWasDeducted && !stockShouldBeDeducted) {
        for (const item of challan.items) {
          if (item.productId) {
            await tx.inventory.updateMany({
              where: { productId: item.productId },
              data: { quantity: { increment: item.quantity } },
            });
          }
        }
      }

      if (!stockWasDeducted && stockShouldBeDeducted) {
        for (const item of challan.items) {
          if (!item.productId) continue;

          const inventory = await tx.inventory.findUnique({
            where: { productId: item.productId },
          });

          if (!inventory || inventory.quantity < item.quantity) {
            throw new Error("Insufficient stock to dispatch challan.");
          }

          await tx.inventory.update({
            where: { productId: item.productId },
            data: { quantity: { decrement: item.quantity } },
          });
        }
      }

      await getChallanDb(tx).update({
        where: { id: challanId },
        data: {
          status: nextStatus,
          notes: notes || null,
          ...transport,
        },
      });
    });
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Could not update delivery challan." };
  }

  revalidatePath("/challans");
  revalidatePath(`/challans/${challanId}`);
  revalidatePath("/inventory");
  redirect(`/challans/${challanId}`);
}

export async function deleteChallanAction(challanId: string): Promise<FormState> {
  const { businessId } = await requireBusiness();

  const challan = (await challanDb.findFirst({
    where: { id: challanId, businessId },
    include: { items: true },
  })) as {
    status: string;
    items: { productId: string | null; quantity: number }[];
  } | null;

  if (!challan) {
    return { error: "Delivery challan not found." };
  }

  await prisma.$transaction(async (tx) => {
    if (challan.status !== "DRAFT" && challan.status !== "CANCELLED") {
      for (const item of challan.items) {
        if (item.productId) {
          await tx.inventory.updateMany({
            where: { productId: item.productId },
            data: { quantity: { increment: item.quantity } },
          });
        }
      }
    }

    await getChallanDb(tx).delete({ where: { id: challanId } });
  });

  revalidatePath("/challans");
  revalidatePath("/inventory");
  redirect("/challans");
}
