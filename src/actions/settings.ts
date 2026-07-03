"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { INDIAN_BUSINESS_TYPES } from "@/lib/constants/business-types";
import { getField, type FormState } from "@/lib/form";
import { requireBusiness } from "@/lib/session";

const VALID_TYPES = new Set(INDIAN_BUSINESS_TYPES.map((t) => t.value));

export async function updateBusinessTypeAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { businessId } = await requireBusiness();

  const businessType = getField(formData, "businessType");
  const licenseNumber = getField(formData, "licenseNumber");

  if (!VALID_TYPES.has(businessType as (typeof INDIAN_BUSINESS_TYPES)[number]["value"])) {
    return { error: "Select a valid business type." };
  }

  if (businessType === "TOBACCO" && !licenseNumber) {
    return { error: "Tobacco license number is required." };
  }

  if (businessType === "PHARMA" && !licenseNumber) {
    return { error: "Drug license number is required." };
  }

  if (businessType === "RESTAURANT" && !licenseNumber) {
    return { error: "FSSAI license number is required." };
  }

  await prisma.business.update({
    where: { id: businessId },
    data: {
      businessType: businessType as never,
      licenseNumber: licenseNumber || null,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/products");
  revalidatePath("/products/new");

  return {};
}

export async function updateBusinessProfileAction(
  _prevState: FormState,
  formData: FormData,
): Promise<FormState> {
  const { businessId } = await requireBusiness();

  const tradeName = getField(formData, "tradeName");
  const phone = getField(formData, "phone");
  const address = getField(formData, "address");
  const city = getField(formData, "city");
  const state = getField(formData, "state");
  const pincode = getField(formData, "pincode");
  const apmcMarketName = getField(formData, "apmcMarketName");

  await prisma.business.update({
    where: { id: businessId },
    data: {
      tradeName: tradeName || null,
      phone: phone || null,
      address: address || null,
      city: city || null,
      state: state || null,
      pincode: pincode || null,
      apmcMarketName: apmcMarketName || null,
    },
  });

  revalidatePath("/settings");
  revalidatePath("/purchases");

  return {};
}
