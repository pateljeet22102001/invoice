"use client";

import { useActionState } from "react";
import { updateBusinessProfileAction } from "@/actions/settings";
import {
  FormError,
  FormField,
  FormSubmitButton,
  FormTextarea,
} from "@/components/forms/form-fields";
import type { FormState } from "@/lib/form";

const initialState: FormState = {};

export function BusinessProfileForm({
  tradeName,
  phone,
  address,
  city,
  state,
  pincode,
  apmcMarketName,
}: {
  tradeName?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  apmcMarketName?: string | null;
}) {
  const [formState, formAction, pending] = useActionState(
    updateBusinessProfileAction,
    initialState,
  );

  return (
    <form action={formAction} className="mt-6 space-y-4 border-t border-slate-200 pt-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">
          Address &amp; phone for bills
        </h3>
        <p className="mt-1 text-xs text-slate-500">
          These details print on farmer purchase receipts and GST invoices.
        </p>
      </div>

      <FormError message={formState.error} />

      <FormField
        label="Trade / shop name (optional)"
        id="tradeName"
        placeholder="e.g. Sharma Traders"
        defaultValue={tradeName ?? undefined}
      />

      <FormField
        label="APMC / mandi name (for mandi purchase bills)"
        id="apmcMarketName"
        placeholder="e.g. Nashik APMC, Vashi Market"
        defaultValue={apmcMarketName ?? undefined}
      />

      <FormField
        label="Mobile"
        id="phone"
        type="tel"
        placeholder="+91 98765 43210"
        defaultValue={phone ?? undefined}
      />

      <FormTextarea
        label="Shop address"
        id="address"
        rows={2}
        placeholder="Shop no., street, area"
        defaultValue={address ?? undefined}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <FormField
          label="City"
          id="city"
          placeholder="Mumbai"
          defaultValue={city ?? undefined}
        />
        <FormField
          label="State"
          id="state"
          placeholder="Maharashtra"
          defaultValue={state ?? undefined}
        />
        <FormField
          label="Pincode"
          id="pincode"
          placeholder="400058"
          defaultValue={pincode ?? undefined}
        />
      </div>

      <FormSubmitButton pending={pending}>Save for bills</FormSubmitButton>
    </form>
  );
}
