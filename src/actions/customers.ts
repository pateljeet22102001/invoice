"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireBusiness } from "@/lib/session";
import { getField, type FormState } from "@/lib/form";

function validateGstin(gstin: string) {
  return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin);
}

function parseCustomerFields(formData: FormData) {
  return {
    name: getField(formData, "name"),
    email: getField(formData, "email"),
    phone: getField(formData, "phone"),
    address: getField(formData, "address"),
    city: getField(formData, "city"),
    state: getField(formData, "state"),
    gstin: getField(formData, "gstin").toUpperCase(),
  };
}

export async function createCustomerAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { businessId } = await requireBusiness();
  const fields = parseCustomerFields(formData);

  if (!fields.name) {
    return { error: "Customer name is required." };
  }

  if (fields.gstin && !validateGstin(fields.gstin)) {
    return { error: "Enter a valid 15-character GSTIN." };
  }

  await prisma.customer.create({
    data: {
      businessId,
      name: fields.name,
      email: fields.email || undefined,
      phone: fields.phone || undefined,
      address: fields.address || undefined,
      city: fields.city || undefined,
      state: fields.state || undefined,
      gstin: fields.gstin || undefined,
    },
  });

  revalidatePath("/customers");
  redirect("/customers");
}

export async function updateCustomerAction(
  customerId: string,
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { businessId } = await requireBusiness();
  const fields = parseCustomerFields(formData);

  if (!fields.name) {
    return { error: "Customer name is required." };
  }

  if (fields.gstin && !validateGstin(fields.gstin)) {
    return { error: "Enter a valid 15-character GSTIN." };
  }

  const existing = await prisma.customer.findFirst({
    where: { id: customerId, businessId },
  });

  if (!existing) {
    return { error: "Customer not found." };
  }

  await prisma.customer.update({
    where: { id: customerId },
    data: {
      name: fields.name,
      email: fields.email || null,
      phone: fields.phone || null,
      address: fields.address || null,
      city: fields.city || null,
      state: fields.state || null,
      gstin: fields.gstin || null,
    },
  });

  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}/edit`);
  redirect("/customers");
}

export async function deleteCustomerAction(
  customerId: string,
): Promise<FormState> {
  const { businessId } = await requireBusiness();

  const customer = await prisma.customer.findFirst({
    where: { id: customerId, businessId },
    include: { _count: { select: { invoices: true } } },
  });

  if (!customer) {
    return { error: "Customer not found." };
  }

  if (customer._count.invoices > 0) {
    return {
      error: "Cannot delete a customer linked to invoices. Delete invoices first.",
    };
  }

  await prisma.customer.delete({ where: { id: customerId } });

  revalidatePath("/customers");
  redirect("/customers");
}
