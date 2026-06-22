"use client";

import { useActionState } from "react";
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
import { SUPPLIER_TYPE_OPTIONS } from "@/lib/constants/supplier-types";
import type { FormState } from "@/lib/form";
import type { Supplier } from "@/types/models";

const initialState: FormState = {};

export function SupplierForm({ supplier }: { supplier?: Supplier }) {
  const action = supplier
    ? updateSupplierAction.bind(null, supplier.id)
    : createSupplierAction;

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />

      <FormSelect
        label="Supplier Type"
        id="supplierType"
        required
        defaultValue={supplier?.supplierType ?? "B2B_SUPPLIER"}
        options={SUPPLIER_TYPE_OPTIONS.map((o) => ({
          value: o.value,
          label: o.label,
        }))}
      />

      <FormField
        label="Supplier Name"
        id="name"
        placeholder="Kumar Agro Traders"
        required
        defaultValue={supplier?.name}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <GstinAutoFields
          defaultGstin={supplier?.gstin ?? ""}
          defaultState={supplier?.state ?? ""}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="PAN (optional — useful for farmers)"
          id="pan"
          placeholder="ABCDE1234F"
          defaultValue={supplier?.pan ?? undefined}
        />
        <FormField
          label="Village / Market town"
          id="village"
          placeholder="Nashik APMC"
          defaultValue={supplier?.village ?? undefined}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Email"
          id="email"
          type="email"
          placeholder="accounts@supplier.in"
          defaultValue={supplier?.email ?? undefined}
        />
        <FormField
          label="Phone"
          id="phone"
          type="tel"
          placeholder="+91 98765 43210"
          defaultValue={supplier?.phone ?? undefined}
        />
      </div>

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
