"use client";

import { useActionState, useMemo, useState } from "react";
import { updateBusinessTypeAction } from "@/actions/settings";
import { FormError, FormField, FormSelect } from "@/components/forms/form-fields";
import { INDIAN_BUSINESS_TYPES } from "@/lib/constants/business-types";
import type { FormState } from "@/lib/form";

const initialState: FormState = {};

export function BusinessTypeForm({
  businessType,
  licenseNumber,
}: {
  businessType: string;
  licenseNumber?: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateBusinessTypeAction,
    initialState,
  );
  const [selectedType, setSelectedType] = useState(businessType);

  const typeMeta = useMemo(
    () => INDIAN_BUSINESS_TYPES.find((t) => t.value === selectedType),
    [selectedType],
  );

  const needsLicense = Boolean(
    typeMeta && "needsLicense" in typeMeta && typeMeta.needsLicense,
  );

  const isTobacco =
    selectedType === "TOBACCO" ||
    selectedType === "AGRICULTURE" ||
    selectedType === "APMC_COMMISSION";

  return (
    <form action={formAction} className="mt-6 space-y-4 border-t border-slate-200 pt-6">
      <div>
        <h3 className="text-sm font-semibold text-slate-900">Change business type</h3>
        <p className="mt-1 text-xs text-slate-500">
          If you buy tobacco or farmer produce in kg, choose{" "}
          <strong>Tobacco Business</strong> or <strong>Agriculture</strong> — the
          product form will match how you actually work.
        </p>
      </div>

      <FormError message={state.error} />

      <FormSelect
        label="Business type"
        id="businessType"
        required
        value={selectedType}
        onChange={(e) => setSelectedType(e.target.value)}
        options={INDIAN_BUSINESS_TYPES.map((t) => ({
          value: t.value,
          label: t.label,
        }))}
      />

      {needsLicense && (
        <FormField
          label={
            typeMeta && "licenseLabel" in typeMeta
              ? typeMeta.licenseLabel
              : "License number"
          }
          id="licenseNumber"
          placeholder="Enter license number"
          required
          defaultValue={licenseNumber ?? undefined}
        />
      )}

      {isTobacco && (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
          Products will be in <strong>kg only</strong>. Stock increases when you
          record a <strong>Purchase Bill</strong> from a farmer — not on this
          product page.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save business type"}
      </button>
    </form>
  );
}
