"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { createChallanAction } from "@/actions/challans";
import {
  FormActions,
  FormError,
  FormField,
  FormSelect,
  FormTextarea,
} from "@/components/forms/form-fields";
import { EwayBillSection } from "@/components/forms/eway-bill-section";
import { CHALLAN_PURPOSES } from "@/lib/constants/challan";

import type { FormState } from "@/lib/form";

export type ChallanCustomerOption = {
  id: string;
  name: string;
  gstin: string | null;
  state: string | null;
};

export type ChallanProductOption = {
  id: string;
  name: string;
  sku: string;
  unit: string;
  hsnCode: string | null;
  stock: number;
};

type LineRow = {
  id: string;
  productId: string;
  quantity: number;
};

const initialState: FormState = {};

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function newLine(): LineRow {
  return { id: crypto.randomUUID(), productId: "", quantity: 1 };
}

export function ChallanForm({
  customers,
  products,
}: {
  customers: ChallanCustomerOption[];
  products: ChallanProductOption[];
}) {
  const [state, formAction, pending] = useActionState(
    createChallanAction,
    initialState,
  );
  const [lines, setLines] = useState<LineRow[]>([newLine()]);
  const [purpose, setPurpose] = useState("STOCK_TRANSFER");

  const productMap = useMemo(
    () => new Map(products.map((p) => [p.id, p])),
    [products],
  );

  const purposeConfig = CHALLAN_PURPOSES.find((p) => p.value === purpose);

  const itemsJson = JSON.stringify(
    lines
      .filter((line) => line.productId && line.quantity > 0)
      .map((line) => ({
        productId: line.productId,
        quantity: line.quantity,
      })),
  );

  function updateLine(id: string, patch: Partial<LineRow>) {
    setLines((current) =>
      current.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
  }

  if (customers.length === 0 || products.length === 0) {
    return (
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Add at least one customer (receiver business) and one product first.
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      <FormError message={state.error} />

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        <p className="font-medium">Delivery Challan — stock movement, not a tax invoice</p>
        <p className="mt-1 text-xs text-amber-800">
          Use this when sending goods to another businessman without a GST sale.
          For B2B sale with tax, create a GST Invoice instead.
        </p>
      </div>

      <FormSelect
        label="Receiving Business"
        id="customerId"
        required
        placeholder="Select business / customer"
        options={customers.map((c) => ({
          value: c.id,
          label: c.gstin ? `${c.name} (${c.gstin})` : c.name,
        }))}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label
            htmlFor="purpose"
            className="mb-1.5 block text-sm font-medium text-slate-700"
          >
            Purpose <span className="text-rose-500">*</span>
          </label>
          <select
            id="purpose"
            name="purpose"
            required
            value={purpose}
            onChange={(e) => setPurpose(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            {CHALLAN_PURPOSES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          {purposeConfig && (
            <p className="mt-1 text-xs text-slate-500">{purposeConfig.description}</p>
          )}
        </div>

        <FormField
          label="Challan Date"
          id="issueDate"
          type="date"
          required
          defaultValue={todayString()}
        />
      </div>

      <FormSelect
        label="Status"
        id="status"
        defaultValue="DISPATCHED"
        options={[
          { value: "DRAFT", label: "Draft (no stock deduction)" },
          { value: "DISPATCHED", label: "Dispatched (deduct stock)" },
        ]}
      />

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-medium text-slate-800">Goods Being Sent</h3>
          <button
            type="button"
            onClick={() => setLines((c) => [...c, newLine()])}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Line
          </button>
        </div>

        <div className="space-y-3">
          {lines.map((line, index) => {
            const product = line.productId
              ? productMap.get(line.productId)
              : undefined;

            return (
              <div
                key={line.id}
                className="grid gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-[1fr_120px_auto]"
              >
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Product {index + 1}
                  </label>
                  <select
                    value={line.productId}
                    onChange={(e) =>
                      updateLine(line.id, { productId: e.target.value })
                    }
                    required
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="" disabled>
                      Select product
                    </option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.unit === "kg" ? p.name : `${p.name} (${p.sku})`} — Stock: {p.stock}
                        {p.hsnCode ? ` — HSN ${p.hsnCode}` : ""}
                      </option>
                    ))}
                  </select>
                  {product?.hsnCode && (
                    <p className="mt-1 text-xs text-slate-500">
                      HSN: {product.hsnCode}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-600">
                    Qty
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={line.quantity}
                    onChange={(e) =>
                      updateLine(line.id, {
                        quantity: Math.max(1, Number(e.target.value) || 1),
                      })
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="flex items-end justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      setLines((c) =>
                        c.length === 1 ? c : c.filter((l) => l.id !== line.id),
                      )
                    }
                    className="rounded-lg p-2 text-slate-400 hover:text-rose-600"
                    aria-label="Remove line"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <EwayBillSection documentLabel="challan" />

      <FormTextarea
        label="Notes"
        id="notes"
        placeholder="Reason for movement, LR number, etc."
        rows={2}
      />

      <input type="hidden" name="items" value={itemsJson} readOnly />

      <FormActions
        cancelHref="/challans"
        pending={pending}
        submitLabel="Create Delivery Challan"
      />
    </form>
  );
}
