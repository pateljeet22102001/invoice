"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSupplierDb } from "@/lib/prisma-purchase";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import { getField, type FormState } from "@/lib/form";

function validateGstin(gstin: string) {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin);
}

function validatePan(pan: string) {
  return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
}

function parseSupplierFields(formData: FormData) {
  return {
    supplierType: getField(formData, "supplierType") || "B2B_SUPPLIER",
    name: getField(formData, "name"),
    email: getField(formData, "email"),
    phone: getField(formData, "phone"),
    address: getField(formData, "address"),
    city: getField(formData, "city"),
    state: getField(formData, "state"),
    village: getField(formData, "village"),
    gstin: getField(formData, "gstin").toUpperCase(),
    pan: getField(formData, "pan").toUpperCase(),
  };
}

export async function createSupplierAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { businessId } = await requireBusiness();
  const fields = parseSupplierFields(formData);

  if (!fields.name) {
    return { error: "Supplier name is required." };
  }

  if (fields.gstin && !validateGstin(fields.gstin)) {
    return { error: "Enter a valid 15-character GSTIN." };
  }

  if (fields.pan && !validatePan(fields.pan)) {
    return { error: "Enter a valid 10-character PAN." };
  }

  if (fields.supplierType === "B2B_SUPPLIER" && !fields.gstin) {
    return { error: "B2B suppliers need GSTIN for input tax credit." };
  }

  await getSupplierDb(prisma).create({
    data: {
      businessId,
      supplierType: fields.supplierType,
      name: fields.name,
      email: fields.email || undefined,
      phone: fields.phone || undefined,
      address: fields.address || undefined,
      city: fields.city || undefined,
      state: fields.state || undefined,
      village: fields.village || undefined,
      gstin: fields.gstin || undefined,
      pan: fields.pan || undefined,
    },
  });

  revalidatePath("/suppliers");
  redirect("/suppliers");
}

export async function updateSupplierAction(
  supplierId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { businessId } = await requireBusiness();
  const fields = parseSupplierFields(formData);

  if (!fields.name) {
    return { error: "Supplier name is required." };
  }

  if (fields.gstin && !validateGstin(fields.gstin)) {
    return { error: "Enter a valid 15-character GSTIN." };
  }

  if (fields.pan && !validatePan(fields.pan)) {
    return { error: "Enter a valid 10-character PAN." };
  }

  const existing = (await getSupplierDb(prisma).findFirst({
    where: { id: supplierId, businessId },
  })) as { id: string } | null;

  if (!existing) {
    return { error: "Supplier not found." };
  }

  await getSupplierDb(prisma).update({
    where: { id: supplierId },
    data: {
      supplierType: fields.supplierType,
      name: fields.name,
      email: fields.email || null,
      phone: fields.phone || null,
      address: fields.address || null,
      city: fields.city || null,
      state: fields.state || null,
      village: fields.village || null,
      gstin: fields.gstin || null,
      pan: fields.pan || null,
    },
  });

  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${supplierId}/edit`);
  redirect("/suppliers");
}

export async function deleteSupplierAction(
  supplierId: string,
): Promise<FormState> {
  const { businessId } = await requireBusiness();

  const supplier = (await getSupplierDb(prisma).findFirst({
    where: { id: supplierId, businessId },
    include: { _count: { select: { purchaseBills: true } } },
  })) as { id: string; _count: { purchaseBills: number } } | null;

  if (!supplier) {
    return { error: "Supplier not found." };
  }

  if (supplier._count.purchaseBills > 0) {
    return {
      error: "Cannot delete a supplier linked to purchase bills. Delete purchases first.",
    };
  }

  await getSupplierDb(prisma).delete({ where: { id: supplierId } });

  revalidatePath("/suppliers");
  redirect("/suppliers");
}
