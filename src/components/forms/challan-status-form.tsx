"use client";

import { useActionState } from "react";
import { updateChallanAction, deleteChallanAction } from "@/actions/challans";
import { DeleteButton } from "@/components/forms/delete-button";
import { EwayBillSection } from "@/components/forms/eway-bill-section";
import {
  FormActions,
  FormError,
  FormSelect,
  FormTextarea,
} from "@/components/forms/form-fields";
import type { FormState } from "@/lib/form";

const initialState: FormState = {};

type ChallanStatusFormProps = {
  challanId: string;
  status: string;
  notes: string | null;
  dispatchPlace: string | null;
  deliveryPlace: string | null;
  vehicleNumber: string | null;
  transporterName: string | null;
  transporterGstin: string | null;
  ewayBillNumber: string | null;
};

export function ChallanStatusForm({
  challanId,
  status,
  notes,
  dispatchPlace,
  deliveryPlace,
  vehicleNumber,
  transporterName,
  transporterGstin,
  ewayBillNumber,
}: ChallanStatusFormProps) {
  const action = updateChallanAction.bind(null, challanId);
  const [state, formAction, pending] = useActionState(action, initialState);

  return (
    <form action={formAction} className="space-y-4">
      <FormError message={state.error} />

      <FormSelect
        label="Status"
        id="status"
        defaultValue={status}
        options={[
          { value: "DRAFT", label: "Draft" },
          { value: "DISPATCHED", label: "Dispatched" },
          { value: "DELIVERED", label: "Delivered" },
          { value: "CANCELLED", label: "Cancelled" },
        ]}
      />

      <EwayBillSection
        documentLabel="challan"
        defaults={{
          ewayBillNumber,
          dispatchPlace,
          deliveryPlace,
          vehicleNumber,
          transporterName,
          transporterGstin,
        }}
      />

      <FormTextarea
        label="Notes"
        id="notes"
        defaultValue={notes ?? undefined}
        rows={3}
      />

      <FormActions
        cancelHref={`/challans/${challanId}`}
        pending={pending}
        submitLabel="Save Challan & E-way Bill"
      />

      <div className="border-t border-slate-200 pt-4">
        <DeleteButton
          action={deleteChallanAction.bind(null, challanId)}
          confirmMessage="Delete this delivery challan? Stock will be restored if already dispatched."
        />
      </div>
    </form>
  );
}
