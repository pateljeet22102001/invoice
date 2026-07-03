"use client";

import { useActionState, useState } from "react";
import {
  createSupplierAction,
  deleteSupplierAction,
  updateSupplierAction,
} from "@/actions/suppliers";
import { DeleteButton } from "@/components/forms/delete-button";
import { GstinAutoFields } from "@/components/forms/gstin-auto-fields";
import {
  FormActions,
  FormError,
  FormField,
  FormSelect,
  FormTextarea,
} from "@/components/forms/form-fields";
import { INDIAN_STATES } from "@/lib/constants/india";
import { SUPPLIER_TYPE_OPTIONS } from "@/lib/constants/supplier-types";
import type { FormState } from "@/lib/form";
import type { Supplier } from "@/types/models";

const initialState: FormState = {};

function needsGstin(type: string) {
  return type === "B2B_SUPPLIER" || type === "APMC_AGENT";
}

function isFarmerStyle(type: string) {
  return type === "FARMER" || type === "UNREGISTERED";
}

function typeHint(type: string) {
  if (type === "B2B_SUPPLIER") {
    return "GSTIN is required. PAN and state are taken from GSTIN automatically.";
  }
  if (type === "APMC_AGENT") {
    return "GSTIN required if agent gives you GST bills for commission.";
  }
  if (type === "FARMER") {
    return "Name and village are enough. GSTIN not needed for farmer purchase.";
  }
  if (type === "UNREGISTERED") {
    return "For parties without GST registration — village and PAN optional.";
  }
  return "Fill what you have for this party.";
}

export function SupplierForm({ supplier }: { supplier?: Supplier }) {
  const action = supplier
    ? updateSupplierAction.bind(null, supplier.id)
    : createSupplierAction;

  const [state, formAction, pending] = useActionState(action, initialState);
  const [supplierType, setSupplierType] = useState<string>(
    supplier?.supplierType ?? "B2B_SUPPLIER",
  );

  const gstParty = needsGstin(supplierType);
  const farmerParty = isFarmerStyle(supplierType);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />

      <FormSelect
        label="Supplier Type"
        id="supplierType"
        name="supplierType"
        required
        value={supplierType}
        onChange={(e) => setSupplierType(e.target.value)}
        options={SUPPLIER_TYPE_OPTIONS.map((o) => ({
          value: o.value,
          label: o.label,
        }))}
      />

      <p className="rounded-lg border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-600">
        {typeHint(supplierType)}
      </p>

      <FormField
        label={farmerParty ? "Name" : "Business / firm name"}
        id="name"
        placeholder={farmerParty ? "Ramesh Patel" : "Kumar Agro Traders"}
        required
        defaultValue={supplier?.name}
      />

      {gstParty && (
        <div className="grid gap-4 sm:grid-cols-2">
          <GstinAutoFields
            defaultGstin={supplier?.gstin ?? ""}
            defaultState={supplier?.state ?? ""}
            defaultPan={supplier?.pan ?? ""}
            gstinRequired
            showPanField
          />
        </div>
      )}

      {farmerParty && (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              label="Village"
              id="village"
              placeholder="Nandgaon"
              defaultValue={supplier?.village ?? undefined}
            />
            <FormField
              label="PAN (optional)"
              id="pan"
              placeholder="ABCDE1234F"
              defaultValue={supplier?.pan ?? undefined}
            />
          </div>
          <FormSelect
            label="State (optional)"
            id="state"
            name="state"
            placeholder="Select state"
            defaultValue={supplier?.state ?? ""}
            options={INDIAN_STATES.map((s) => ({ value: s, label: s }))}
          />
        </>
      )}

      {supplierType === "APMC_AGENT" && (
        <FormField
          label="Market / APMC name (optional)"
          id="village"
          placeholder="Nashik APMC"
          defaultValue={supplier?.village ?? undefined}
        />
      )}

      {supplierType === "OTHER" && (
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField
            label="GSTIN (optional)"
            id="gstin"
            name="gstin"
            placeholder="27AABCS1429B1Z5"
            defaultValue={supplier?.gstin ?? undefined}
          />
          <FormField
            label="Village / town (optional)"
            id="village"
            placeholder="Nashik"
            defaultValue={supplier?.village ?? undefined}
          />
        </div>
      )}

      <FormField
        label="Phone"
        id="phone"
        type="tel"
        placeholder="+91 98765 43210"
        defaultValue={supplier?.phone ?? undefined}
      />

      {!farmerParty && (
        <FormField
          label="Email (optional)"
          id="email"
          type="email"
          placeholder="accounts@supplier.in"
          defaultValue={supplier?.email ?? undefined}
        />
      )}

      {!farmerParty && (
        <>
          <FormTextarea
            label="Address"
            id="address"
            placeholder="Street, area, landmark"
            defaultValue={supplier?.address ?? undefined}
          />

          <FormField
            label="City"
            id="city"
            placeholder="Pune"
            defaultValue={supplier?.city ?? undefined}
          />
        </>
      )}

      <FormActions
        cancelHref="/suppliers"
        pending={pending}
        submitLabel={supplier ? "Update Supplier" : "Save Supplier"}
      />

      {supplier && (
        <div className="border-t border-slate-200 pt-4">
          <DeleteButton
            action={deleteSupplierAction.bind(null, supplier.id)}
            confirmMessage={`Delete supplier "${supplier.name}"? This cannot be undone.`}
          />
        </div>
      )}
    </form>
  );
}
