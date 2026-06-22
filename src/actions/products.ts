"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import { GST_RATES } from "@/lib/constants/india";
import { normalizeProductUnit, roundQuantity } from "@/lib/constants/product-units";
import {
  generateNextProductSku,
} from "@/lib/products/sku";
import { getField, getNumber, type FormState } from "@/lib/form";

function parseProductFields(formData: FormData, isEdit = false) {
  const unit = normalizeProductUnit(getField(formData, "unit") || "pcs");
  const costRaw = getField(formData, "costPrice");
  const costPrice = costRaw === "" ? NaN : getNumber(formData, "costPrice");

  return {
    sku: getField(formData, "sku").toUpperCase(),
    name: getField(formData, "name"),
    description: getField(formData, "description"),
    unit,
    hsnCode: getField(formData, "hsnCode"),
    unitPrice: getNumber(formData, "unitPrice"),
    costPrice,
    gstRate: getNumber(formData, "gstRate"),
    quantity: isEdit ? getNumber(formData, "quantity") : getNumber(formData, "quantity"),
    lowStockThreshold: getNumber(formData, "lowStockThreshold"),
  };
}

function validateProductFields(fields: ReturnType<typeof parseProductFields>) {
  if (!fields.name) {
    return "Product name is required.";
  }

  if (!fields.sku) {
    return "Product code could not be generated. Try again.";
  }

  if (!Number.isFinite(fields.unitPrice) || fields.unitPrice < 0) {
    return "Enter a valid selling price.";
  }

  if (!Number.isFinite(fields.costPrice) || fields.costPrice < 0) {
    return "Enter a valid buy rate (cost per kg or pcs).";
  }

  if (!GST_RATES.includes(fields.gstRate as (typeof GST_RATES)[number])) {
    return "Select a valid GST rate.";
  }

  if (fields.unit !== "pcs" && fields.unit !== "kg") {
    return "Unit must be pcs or kg.";
  }

  if (!Number.isFinite(fields.quantity) || fields.quantity < 0) {
    return "Enter a valid stock quantity.";
  }

  return null;
}

export async function createProductAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { businessId } = await requireBusiness();

  const business = await prisma.business.findUnique({
    where: { id: businessId },
    select: { businessType: true },
  });
  const businessType = business?.businessType ?? "GENERAL_TRADING";

  const parsed = parseProductFields(formData);
  const autoSku = getField(formData, "autoSku") === "1";

  const sku =
    autoSku || !parsed.sku
      ? await generateNextProductSku(businessId, businessType)
      : parsed.sku;

  const fields = { ...parsed, sku };
  const validationError = validateProductFields(fields);

  if (validationError) {
    return { error: validationError };
  }

  const existing = await prisma.product.findUnique({
    where: { businessId_sku: { businessId, sku: fields.sku } },
  });

  if (existing) {
    return { error: "A product with this code already exists." };
  }

  await prisma.product.create({
    data: {
      businessId,
      sku: fields.sku,
      name: fields.name,
      description: fields.description || undefined,
      unit: fields.unit,
      hsnCode: fields.hsnCode || undefined,
      unitPrice: fields.unitPrice,
      costPrice: fields.costPrice,
      gstRate: fields.gstRate,
      inventory: {
        create: {
          quantity: roundQuantity(fields.quantity, fields.unit),
          lowStockThreshold: Number.isFinite(fields.lowStockThreshold)
            ? roundQuantity(fields.lowStockThreshold, fields.unit)
            : 10,
        },
      },
    },
  });

  revalidatePath("/products");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  redirect("/products");
}

export async function updateProductAction(
  productId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { businessId } = await requireBusiness();

  const existing = await prisma.product.findFirst({
    where: { id: productId, businessId },
    include: { inventory: true },
  });

  if (!existing) {
    return { error: "Product not found." };
  }

  const parsed = parseProductFields(formData, true);
  const fields = {
    ...parsed,
    sku: existing.sku,
  };
  const validationError = validateProductFields(fields);

  if (validationError) {
    return { error: validationError };
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id: productId },
      data: {
        sku: fields.sku,
        name: fields.name,
        description: fields.description || null,
        unit: fields.unit,
        hsnCode: fields.hsnCode || null,
        unitPrice: fields.unitPrice,
        costPrice: fields.costPrice,
        gstRate: fields.gstRate,
      },
    });

    if (existing.inventory) {
      await tx.inventory.update({
        where: { productId },
        data: {
          quantity: roundQuantity(fields.quantity, fields.unit),
          lowStockThreshold: Number.isFinite(fields.lowStockThreshold)
            ? roundQuantity(fields.lowStockThreshold, fields.unit)
            : existing.inventory.lowStockThreshold,
        },
      });
    } else {
      await tx.inventory.create({
        data: {
          productId,
          quantity: roundQuantity(fields.quantity, fields.unit),
          lowStockThreshold: Number.isFinite(fields.lowStockThreshold)
            ? roundQuantity(fields.lowStockThreshold, fields.unit)
            : 10,
        },
      });
    }
  });

  revalidatePath("/products");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  redirect("/products");
}

export async function deleteProductAction(productId: string): Promise<FormState> {
  const { businessId } = await requireBusiness();

  const product = await prisma.product.findFirst({
    where: { id: productId, businessId },
  });

  if (!product) {
    return { error: "Product not found." };
  }

  await prisma.product.delete({ where: { id: productId } });

  revalidatePath("/products");
  revalidatePath("/inventory");
  revalidatePath("/dashboard");
  redirect("/products");
}
