"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { prisma } from "@/lib/prisma";
import { signIn, signOut } from "@/auth";

import { ensureChartOfAccounts } from "@/lib/accounting/chart-of-accounts";
import { INDIAN_BUSINESS_TYPES } from "@/lib/constants/business-types";

export type AuthFormState = {
  error?: string;
  success?: string;
};

function getField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function parseBusinessType(value: string) {
  return INDIAN_BUSINESS_TYPES.some((t) => t.value === value)
    ? value
    : "GENERAL_TRADING";
}

export async function loginAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = getField(formData, "email").toLowerCase();
  const password = getField(formData, "password");

  if (!email || !password) {
    return { error: "Email and password are required." };
  }

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Invalid email or password." };
    }
    throw error;
  }

  return {};
}

export async function signupAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const name = getField(formData, "name");
  const email = getField(formData, "email").toLowerCase();
  const password = getField(formData, "password");
  const confirmPassword = getField(formData, "confirmPassword");
  const businessName = getField(formData, "businessName");
  const businessType = parseBusinessType(getField(formData, "businessType"));
  const tradeName = getField(formData, "tradeName");
  const phone = getField(formData, "phone");
  const address = getField(formData, "address");
  const city = getField(formData, "city");
  const state = getField(formData, "state");
  const pincode = getField(formData, "pincode");
  const gstin = getField(formData, "gstin").toUpperCase();
  const pan = getField(formData, "pan").toUpperCase();
  const licenseNumber = getField(formData, "licenseNumber");
  const apmcMarketName = getField(formData, "apmcMarketName");
  const commissionRateRaw = getField(formData, "commissionRate");

  if (!name || !email || !password || !businessName || !gstin) {
    return { error: "Please fill in all required fields including GSTIN." };
  }

  if (businessType === "APMC_COMMISSION" && !apmcMarketName) {
    return { error: "APMC market name is required for commission agents." };
  }

  if (businessType === "TOBACCO" && !licenseNumber) {
    return { error: "Tobacco / excise license number is required." };
  }

  let commissionRate: number | undefined;
  if (commissionRateRaw) {
    commissionRate = Number(commissionRateRaw);
    if (Number.isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
      return { error: "Commission rate must be between 0 and 100." };
    }
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstin)) {
    return { error: "Enter a valid 15-character GSTIN (e.g. 27AABCS1429B1Z5)." };
  }

  if (pan && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
    return { error: "Enter a valid 10-character PAN." };
  }

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return { error: "An account with this email already exists." };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: {
        name: businessName,
        businessType: businessType as
          | "GENERAL_TRADING"
          | "WHOLESALE"
          | "RETAIL"
          | "MANUFACTURING"
          | "SERVICES"
          | "TOBACCO"
          | "APMC_COMMISSION"
          | "AGRICULTURE"
          | "PHARMA"
          | "RESTAURANT"
          | "TRANSPORT"
          | "OTHER",
        tradeName: tradeName || undefined,
        email,
        phone: phone || undefined,
        address: address || undefined,
        city: city || undefined,
        state: state || undefined,
        pincode: pincode || undefined,
        gstin,
        pan: pan || undefined,
        licenseNumber: licenseNumber || undefined,
        apmcMarketName: apmcMarketName || undefined,
        commissionRate: commissionRate ?? undefined,
        currency: "INR",
      },
    });

    await tx.user.create({
      data: {
        name,
        email,
        passwordHash,
        businessId: business.id,
      },
    });

    await ensureChartOfAccounts(business.id, tx);
  });

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Account created, but sign-in failed. Please log in." };
    }
    throw error;
  }

  return {};
}

export async function logoutAction() {
  await signOut({ redirectTo: "/login" });
}

export async function forgotPasswordAction(
  _prevState: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const email = getField(formData, "email").toLowerCase();
  const password = getField(formData, "password");
  const confirmPassword = getField(formData, "confirmPassword");

  if (!email || !password || !confirmPassword) {
    return { error: "Email, new password, and confirmation are required." };
  }

  if (password.length < 8) {
    return { error: "Password must be at least 8 characters." };
  }

  if (password !== confirmPassword) {
    return { error: "Passwords do not match." };
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return {
      error:
        "No account found with this email. Check the spelling or create a new account.",
    };
  }

  const passwordHash = await bcrypt.hash(password, 12);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return {
    success: "Password updated. You can sign in with your new password.",
  };
}
