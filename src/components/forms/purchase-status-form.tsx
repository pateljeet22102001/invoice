"use client";

import { useActionState } from "react";
import { updatePurchaseAction, deletePurchaseAction } from "@/actions/purchases";
import { DeleteButton } from "@/components/forms/delete-button";
import {
  FormActions,
  FormError,
  FormSelect,
  FormTextarea,
} from "@/components/forms/form-fields";
import type { FormState } from "@/lib/form";
import type { PurchaseStatus } from "@/types/models";

const initialState: FormState = {};

export function PurchaseStatusForm({
  purchaseId,
  status,
  notes,
}: {
  purchaseId: string;
  status: PurchaseStatus;
  notes: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    updatePurchaseAction.bind(null, purchaseId),
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />

      <FormSelect
        label="Status"
        id="status"
        defaultValue={status}
        options={[
          { value: "DRAFT", label: "Draft" },
          { value: "RECEIVED", label: "Received (stock added)" },
          { value: "PAID", label: "Paid" },
          { value: "CANCELLED", label: "Cancelled" },
        ]}
      />

      <FormTextarea
        label="Notes"
        id="notes"
        placeholder="Payment reference or remarks"
        defaultValue={notes ?? undefined}
        rows={3}
      />

      <FormActions
        cancelHref="/purchases"
        pending={pending}
        submitLabel="Update Purchase"
      />

      <div className="border-t border-slate-200 pt-4">
        <DeleteButton
          action={deletePurchaseAction.bind(null, purchaseId)}
          confirmMessage="Delete this purchase bill? Stock and accounting entries will be reversed."
        />
      </div>
    </form>
  );
}
