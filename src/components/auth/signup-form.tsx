"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { signupAction, type AuthFormState } from "@/actions/auth";
import { INDIAN_BUSINESS_TYPES } from "@/lib/constants/business-types";
import {
  AuthError,
  AuthField,
  AuthSelect,
  AuthSubmitButton,
} from "@/components/auth/auth-fields";
import { GstinAutoFields } from "@/components/forms/gstin-auto-fields";

const initialState: AuthFormState = {};

export function SignupForm() {
  const [state, formAction, pending] = useActionState(signupAction, initialState);
  const [businessType, setBusinessType] = useState("GENERAL_TRADING");

  const typeConfig = useMemo(
    () => INDIAN_BUSINESS_TYPES.find((t) => t.value === businessType),
    [businessType],
  );

  return (
    <form action={formAction} className="space-y-4" autoComplete="off">
      <AuthError message={state.error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <AuthField
          label="Your Name"
          id="name"
          placeholder="Rahul Sharma"
          required
          className="sm:col-span-2"
        />
        <AuthField
          label="Email"
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@company.in"
          required
          className="sm:col-span-2"
        />
        <AuthField
          label="Password"
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder="Minimum 8 characters"
          required
        />
        <AuthField
          label="Confirm Password"
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          placeholder="Repeat password"
          required
        />
      </div>

      <div className="border-t border-slate-200 pt-4">
        <p className="mb-1 text-sm font-medium text-slate-800">Company Details</p>
        <p className="mb-4 text-xs text-slate-500">
          GST number is mandatory for Indian businesses. Select your business type below.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <GstinAutoFields gstinRequired showPanField />

          <div className="sm:col-span-2">
            <label
              htmlFor="businessType"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Business Type <span className="text-rose-500">*</span>
            </label>
            <select
              id="businessType"
              name="businessType"
              required
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            >
              {INDIAN_BUSINESS_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
            {typeConfig && (
              <p className="mt-1 text-xs text-slate-500">{typeConfig.description}</p>
            )}
          </div>

          <AuthField
            label="Company / Firm Name"
            id="businessName"
            placeholder={
              businessType === "APMC_COMMISSION"
                ? "Sharma Commission Agency"
                : "Sharma Traders Pvt Ltd"
            }
            required
            className="sm:col-span-2"
          />

          <AuthField
            label="Trade Name (if different)"
            id="tradeName"
            placeholder="Trade name on shop board or market"
            hint="Optional — display name for invoices"
            className="sm:col-span-2"
          />

          {businessType === "APMC_COMMISSION" && (
            <>
              <AuthField
                label="APMC Market Name"
                id="apmcMarketName"
                placeholder="e.g. Vashi APMC, Azadpur Market, Nashik APMC"
                required
                className="sm:col-span-2"
              />
              <AuthField
                label="Default Commission Rate (%)"
                id="commissionRate"
                type="number"
                min="0"
                max="100"
                step="0.1"
                placeholder="2.5"
                hint="Your usual commission % on farmer sales"
                defaultValue="2.5"
              />
              <AuthField
                label="APMC Agent License No."
                id="licenseNumber"
                placeholder="APMC market registration number"
              />
            </>
          )}

          {businessType === "TOBACCO" && (
            <AuthField
              label="Tobacco / Excise License No."
              id="licenseNumber"
              placeholder="State tobacco or excise license"
              required
              className="sm:col-span-2"
            />
          )}

          {businessType === "PHARMA" && (
            <AuthField
              label="Drug License No."
              id="licenseNumber"
              placeholder="DL-XX-XXXXXXX"
              className="sm:col-span-2"
            />
          )}

          {businessType === "RESTAURANT" && (
            <AuthField
              label="FSSAI License No."
              id="licenseNumber"
              placeholder="14-digit FSSAI number"
              className="sm:col-span-2"
            />
          )}

          <AuthField
            label="Phone"
            id="phone"
            type="tel"
            placeholder="+91 98765 43210"
          />
          <AuthField label="City" id="city" placeholder="Mumbai" />
          <AuthField
            label="Pincode"
            id="pincode"
            placeholder="400001"
            maxLength={6}
          />
          <AuthField
            label="Business Address"
            id="address"
            placeholder="Shop no., market, street, area"
            className="sm:col-span-2"
          />
        </div>
      </div>

      <AuthSubmitButton pending={pending}>Create Account</AuthSubmitButton>

      <p className="text-center text-sm text-slate-600">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
          Sign in
        </Link>
      </p>

      <p className="text-center text-sm text-slate-600">
        <Link href="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
          Forgot password?
        </Link>
      </p>
    </form>
  );
}
