"use client";

import { useActionState } from "react";
import { updateInvoiceAction, deleteInvoiceAction } from "@/actions/invoices";
import { DeleteButton } from "@/components/forms/delete-button";
import { EwayBillSection } from "@/components/forms/eway-bill-section";
import {
  FormActions,
  FormError,
  FormSelect,
  FormTextarea,
} from "@/components/forms/form-fields";
import type { FormState } from "@/lib/form";
import type { InvoiceStatus } from "@/types/models";

const initialState: FormState = {};

export function InvoiceStatusForm({
  invoiceId,
  status,
  notes,
  dispatchPlace,
  deliveryPlace,
  vehicleNumber,
  transporterName,
  transporterGstin,
  ewayBillNumber,
}: {
  invoiceId: string;
  status: InvoiceStatus;
  notes: string | null;
  dispatchPlace: string | null;
  deliveryPlace: string | null;
  vehicleNumber: string | null;
  transporterName: string | null;
  transporterGstin: string | null;
  ewayBillNumber: string | null;
}) {
  const [state, formAction, pending] = useActionState(
    updateInvoiceAction.bind(null, invoiceId),
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
          { value: "SENT", label: "Sent" },
          { value: "PAID", label: "Paid" },
          { value: "OVERDUE", label: "Overdue" },
          { value: "CANCELLED", label: "Cancelled" },
        ]}
      />

      <EwayBillSection
        documentLabel="invoice"
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
        placeholder="Payment terms or additional notes"
        defaultValue={notes ?? undefined}
        rows={3}
      />

      <FormActions
        cancelHref={`/invoices/${invoiceId}`}
        pending={pending}
        submitLabel="Save Invoice & E-way Bill"
      />

      <div className="border-t border-slate-200 pt-4">
        <DeleteButton
          action={deleteInvoiceAction.bind(null, invoiceId)}
          confirmMessage="Delete this invoice? Stock will be restored if it was deducted."
        />
      </div>
    </form>
  );
}
