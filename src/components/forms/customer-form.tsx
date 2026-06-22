"use client";

import { useActionState } from "react";
import {
  createCustomerAction,
  deleteCustomerAction,
  updateCustomerAction,
} from "@/actions/customers";
import { DeleteButton } from "@/components/forms/delete-button";
import { GstinAutoFields } from "@/components/forms/gstin-auto-fields";
import {
  FormActions,
  FormError,
  FormField,
  FormTextarea,
} from "@/components/forms/form-fields";
import type { FormState } from "@/lib/form";
import type { Customer } from "@/types/models";

const initialState: FormState = {};

export function CustomerForm({ customer }: { customer?: Customer }) {
  const action = customer
    ? updateCustomerAction.bind(null, customer.id)
    : createCustomerAction;

  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />

      <FormField
        label="Customer Name"
        id="name"
        placeholder="Patel Electronics"
        required
        defaultValue={customer?.name}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <GstinAutoFields
          defaultGstin={customer?.gstin ?? ""}
          defaultState={customer?.state ?? ""}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          label="Email"
          id="email"
          type="email"
          placeholder="billing@customer.in"
          defaultValue={customer?.email ?? undefined}
        />
        <FormField
          label="Phone"
          id="phone"
          type="tel"
          placeholder="+91 98765 43210"
          defaultValue={customer?.phone ?? undefined}
        />
      </div>

      <FormTextarea
        label="Address"
        id="address"
        placeholder="Street, area, landmark"
        defaultValue={customer?.address ?? undefined}
      />

      <FormField
        label="City"
        id="city"
        placeholder="Mumbai"
        defaultValue={customer?.city ?? undefined}
      />

      <FormActions
        cancelHref="/customers"
        pending={pending}
        submitLabel={customer ? "Update Customer" : "Save Customer"}
      />

      {customer && (
        <div className="border-t border-slate-200 pt-4">
          <DeleteButton
            action={deleteCustomerAction.bind(null, customer.id)}
            confirmMessage={`Delete customer "${customer.name}"? This cannot be undone.`}
          />
        </div>
      )}
    </form>
  );
}
